import { Component, OnInit } from '@angular/core';
import { firestore } from 'firebase/app';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FSShared } from 'src/app/models/fsshared';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { User } from 'src/app/models/user';
import { Card } from 'src/app/models/card';
import { SqliteService } from 'src/app/services/sqlite.service';
import { Quiz } from 'src/app/models/quiz';
import { ImageService } from 'src/app/services/images.service';
import { Router } from '@angular/router';
import * as uuid from 'uuid';

@Component({
  selector: 'app-sharecode',
  templateUrl: './sharecode.component.html',
  styleUrls: ['./sharecode.component.scss'],
})
export class SharecodeComponent implements OnInit {
  _loader;

  constructor(
    private firestoreService: FirestoreService,
    private sqlite: SqliteService,
    private alert: AlertController,
    private load: LoadingController,
    private images: ImageService,
    private router: Router
  ) { }

  ngOnInit() { }


  async submitCode(code) {
    this._loader = await this.load.create({ message: 'Preparing download...' });
    this._loader.present();

    const cleancode = code.sharecode.toLowerCase().trim().toString();
    const expiredTime = firestore.Timestamp.now().seconds - 172800;
    const sharedQuizzes: FSShared[] = (await this.firestoreService.getShareQuizByCode(cleancode))
      .docs
      .map(q => {
        return {
          ...q.data()
        } as FSShared;
      });
    const sharedQuiz = sharedQuizzes[0];
    console.log(sharedQuiz);

    // if quiz doesnt exist or expired
    if (sharedQuizzes.length === 0 || sharedQuiz.sharetime < expiredTime) {
      this._loader.dismiss();
      this.alert.create({
        header: 'QuizSet not found',
        message: 'Sorry, we couldn\'nt find a shared QuizCard Set with this code. Check the code with your friend and try again.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }

    // check for existing quiz
    const existingQuiz = await this.sqlite.getQuiz(sharedQuiz.id);

    if (sharedQuiz.shareId === existingQuiz.shareId) {
      this._loader.dismiss();
      this.alert.create({
        header: 'Cardset Exists',
        message: 'This Card set already exists on your device. Don\'t need to download',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }

    // else start download if quiz
    this._loader = await this.load.create({ message: 'Downloading QuizCard set...'});
    this._loader.present();

    // get quiz cards
    const cards = (await this.firestoreService.getCloudSetCards(sharedQuiz.shareId, 'user_shared_quizzes'))
      .docs
      .map(c => {
        return {
          ...c.data(),
          correct_count: 0
        } as Card;
      });
    console.log(cards);

    const newQuizId = uuid.v1();

    const newQuiz: Quiz = {
      ...sharedQuiz,
      id: newQuizId,
      switchtext: 0,
      cardview: 'detailed-view',
      isArchived: 0,
      isBackable: 1,
      isMergeable: 1,
      isShareable: 1,
      isPurchased: 0,
      cloudId: '',
      shareId: '',
      networkId: '',
      ttsaudio: 0,
      quizLimit: 30,
      quizTimer: 0,
      studyShuffle: 0,
      quizShuffle: 1,
      ttsSpeed: 80
    };

    await this.sqlite.addQuiz(newQuiz);

    for (let i = 0; i < cards.length; i++) {
      cards[i].id = uuid.v1();
      cards[i].quiz_id = newQuizId;

      if (cards[i].c_image !== '') {
        const fn = cards[i].image_path.substr(cards[i].image_path.lastIndexOf('/') + 1);
        const imgUrl = await this.images.storageRef.child(sharedQuiz.userId + '/' + fn).getDownloadURL();
        const downloadedImage = await this.images.downloadFirebaseImageToDevice(imgUrl);
        // this.toast.loadToast(downloadedImage.c_image, 10);
        cards[i].c_image = downloadedImage.c_image;
        cards[i].image_path = downloadedImage.image_path;
      }
    }
    await this.sqlite.addCards(cards);

    this._loader.dismiss();
    this.alert.create({
      header: 'Download Success!',
      message: 'You\'ve successfully downloaded this QuizCard set!',
      buttons: ['OK']
    }).then(a => a.present());
    this.router.navigate(['/tabs/tabhome']);
  }
}
