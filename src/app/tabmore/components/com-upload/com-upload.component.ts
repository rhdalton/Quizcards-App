import { Component, OnInit } from '@angular/core';
import { SqliteService } from 'src/app/services/sqlite.service';
import { Quiz } from 'src/app/models/quiz';
import { AlertController, ModalController } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FSQuiz } from 'src/app/models/fsquiz';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';
import { ComUploadmodalComponent } from '../com-uploadmodal/com-uploadmodal.component';
import { Card } from 'src/app/models/card';

@Component({
  selector: 'app-com-upload',
  templateUrl: './com-upload.component.html',
  styleUrls: ['./com-upload.component.scss'],
})
export class ComUploadComponent implements OnInit {
  Quizzes: Quiz[] = [];
  User: User;
  _userSub: Subscription;

  constructor(
    private auth: AuthService,
    private sqlite: SqliteService,
    private firestoreService: FirestoreService,
    private alert: AlertController,
    private modal: ModalController
  ) { }

  async ngOnInit() {

    this._userSub = this.auth.appUser$.subscribe(async (appUser) => {
      if (!appUser) this.User = null;
      else {
        this.User = appUser;

        const allquizzes: Quiz[] = await this.sqlite.getQuizzes();
        for (let i = 0; i < allquizzes.length; i++) {
          if (allquizzes[i].isShareable === 1) this.Quizzes.push(allquizzes[i]);
        }
      }
    });
  }

  async uploadQuiz(quiz: Quiz) {

    if (quiz.cardcount < 10) {
      this.alert.create({
        header: 'Card Count Limit',
        message: 'QuizCard sets uploaded to the Community are required to have at least 10 cards.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }

    const cards: Card[] = await this.sqlite.getQuizCards(quiz.id);
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].c_audio !== '' || cards[i].c_image !== '') {
        this.alert.create({
          header: 'Contains Image/Audio',
          message: 'Uploading images and audio to the community is currently not enabled. This will be enabled in a later update.',
          buttons: ['DISMISS']
        }).then(a => a.present());
        return;
      }
    }

    let quizExist: NWQuiz;
    if (quiz.networkId && quiz.networkId !== '') quizExist = (await this.firestoreService.getFirestoreQuiz(quiz.networkId, 'network_quizzes')).data() as NWQuiz;

    console.log(quiz, quizExist);

    if (quizExist && quizExist.quizauthor === this.User.displayName) {
      this.alert.create({
        header: 'QuizCard Set Exists',
        message: 'This Set already exists in the QuizCards Community. You can update the Community set with the one on your device.',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Update', handler: () => this.uploadQuizDetailsModal(quiz, quizExist) }
        ]
      }).then(a => a.present());
      return;
    } else if (quizExist) {
      this.alert.create({
        header: 'QuizCard Set Exists',
        message: 'This Set already exists in the QuizCards Community. You can only upload card sets originally created by you.',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
        ]
      }).then(a => a.present());
      return;
    } else {
      this.uploadQuizDetailsModal(quiz);
    }
  }

  async uploadQuizDetailsModal(quiz: Quiz, NWquiz: NWQuiz = null) {
    this.modal.create({
      component: ComUploadmodalComponent,
      componentProps: {
        modal: this.modal,
        quiz: quiz,
        nwquiz: NWquiz,
        user: this.User
      },
      cssClass: 'download-modal'
    }).then(m => m.present());
  }
}
