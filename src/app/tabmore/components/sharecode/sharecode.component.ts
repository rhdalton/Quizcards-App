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
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';
import { ExportCard } from 'src/app/models/exportcard';
import { ExportQuiz } from 'src/app/models/exportquiz';
import { Subscription } from 'rxjs';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { ToastNotification } from 'src/app/shared/classes/toast';

@Component({
  selector: 'app-sharecode',
  templateUrl: './sharecode.component.html',
  styleUrls: ['./sharecode.component.scss'],
})
export class SharecodeComponent implements OnInit {
  _loader;
  _userSub: Subscription;
  _isPro: boolean;
  User: User;

  constructor(
    private auth: AuthService,
    private firestoreService: FirestoreService,
    private app: AppdataClass,
    private alert: AlertController,
    private load: LoadingController,
    private images: ImageService,
    private router: Router,
    private quizjson: QuizcardsExport,
    private toast: ToastNotification
  ) { }

  ngOnInit() {
    this._userSub = this.auth.appUser$.subscribe(appUser => {
      if (!appUser) this.User = null;
      else {
        this.User = appUser;
        // this.toast.loadToast('status: ' + this.User.userStatus);
        this._isPro = this.app.isPro(this.User.userStatus);
      }
    });
  }

  async alertData() {
    this._loader.dismiss();
    return new Promise(async (res) => {
      this.alert.create({
        header: 'Card Set Images',
        message: 'This card set contains Images. Downloading this set may use extra data on your device\'s Internet data plan based on the number of images ' +
          'that require downloading. Do you want to continue with the download of this set and all images?',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => res(false) },
          { text: 'Continue', handler: () => res(true) }
        ]
      }).then(a => a.present());
    });
  }

  async submitCode(code) {
    const cleancode = code.sharecode.toLowerCase().trim().toString();
    if (cleancode === '') return;

    this._loader = await this.load.create({ message: 'Preparing download...' });
    this._loader.present();

    const sharedQuizzes: FSShared[] = (await this.firestoreService.getShareQuizByCode(cleancode))
      .docs
      .map(q => {
        return {
          ...q.data()
        } as FSShared;
      });

    // if quiz doesnt exist
    if (sharedQuizzes.length === 0) {
      this._loader.dismiss();
      this.alert.create({
        header: 'QuizCard Set not found',
        message: 'Sorry, we couldn\'nt find a shared QuizCard Set with this code. Check the code with your friend and try again.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }
    const sharedQuiz = sharedQuizzes[0];
    const sharedQuizJson: ExportQuiz = JSON.parse(sharedQuiz.quizData);

    this._loader.dismiss();

    if (sharedQuiz.imageData && sharedQuiz.imageData !== '') {
      if (!await this.alertData()) {
        this.toast.loadToast('Cardset download canceled.');
        return;
      }
    }

    if (!this._isPro && sharedQuiz.imageData) {
      if (await this.alertImages()) {
        for (let i = 0; i < sharedQuizJson.cards.length; i++) {
          sharedQuizJson.cards[i].img = '';
          sharedQuizJson.cards[i].imgp = '';
        }
      } else {
        this.toast.loadToast('QuizCards download canceled.');
        this.router.navigate(['/tabs/tabhome']);
        return;
      }
    }

    // else start download if quiz
    this._loader = await this.load.create({ message: 'Downloading QuizCard set...'});
    this._loader.present();

    // get quiz cards
    sharedQuizJson.quizid = uuid.v1();
    await this.quizjson.importQuiz(sharedQuizJson);

    if (sharedQuiz.imageData) {
      for (let i = 0; i < sharedQuizJson.cards.length; i++) {
        if (sharedQuizJson.cards[i].img !== '') {
          const fn = sharedQuizJson.cards[i].imgp.substr(sharedQuizJson.cards[i].imgp.lastIndexOf('/') + 1);
          const imgUrl = await this.images.storageRef.child('shared/' + sharedQuiz.shareId + '/' + fn).getDownloadURL();
          const downloadedImage = await this.images.downloadFirebaseImageToDevice(imgUrl);
          // this.toast.loadToast(downloadedImage.c_image, 10);
          sharedQuizJson.cards[i].img = downloadedImage.c_image;
          sharedQuizJson.cards[i].imgp = downloadedImage.image_path;
        }
      }
    }

    await this.quizjson.importCards(sharedQuizJson.quizid, sharedQuizJson.cards);
    this.firestoreService.updateCloudDownloadCount(sharedQuiz.shareId, 'user_shared_cardsets');

    this._loader.dismiss();
    this.alert.create({
      header: 'Download Success!',
      message: 'You\'ve successfully downloaded this QuizCard set!',
      buttons: ['OK']
    }).then(a => a.present());
    this.router.navigate(['/tabs/tabhome']);
  }

  async alertImages() {
    return new Promise((res, rej) => {
      this.alert.create({
        header: 'Set Contains Images',
        message: 'This QuizCard set contains images. Only Pro Account users can download the images in this set. Do you want to continue this download without images?',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => res(false) },
          { text: 'Yes', handler: () => res(true) }
        ]
      }).then(a => a.present());
    });
  }
}
