import { Component, OnInit } from '@angular/core';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { NavParams, LoadingController, Platform, AlertController } from '@ionic/angular';
import { SqliteService } from 'src/app/services/sqlite.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Quiz } from 'src/app/models/quiz';
import { Card } from 'src/app/models/card';
import { NWCard } from 'src/app/models/nwcard';
import { ExportQuiz } from 'src/app/models/exportquiz';
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';

@Component({
  selector: 'app-com-download',
  templateUrl: './com-download.component.html',
  styleUrls: ['./com-download.component.scss'],
})
export class ComDownloadComponent implements OnInit {
  _loader;
  modal;
  existingQuiz: Quiz;
  quiz: NWQuiz;
  quizData: ExportQuiz;
  noPreview = '';

  constructor(
    private params: NavParams,
    private load: LoadingController,
    private sqlite: SqliteService,
    private firestoreService: FirestoreService,
    private platform: Platform,
    private alert: AlertController,
    private importquiz: QuizcardsExport
  ) {
    this.modal = this.params.get('modal');
    this.quiz = this.params.get('quiz');
  }

  async ngOnInit() {
    if (this.quiz.quizData) {
      // const quizDataString = await this.firestoreService.getNetworkQuizCards(this.quiz.networkId);
      this.quizData = JSON.parse(this.quiz.quizData);
    } else {
      this.noPreview = 'No preview avaliable';
      console.log('no quizData');
    }
    // console.log(this.quizCards);
  }

  async downloadQuiz(quiz: NWQuiz) {
    this.modal.dismiss();
    // console.log(quiz);

    if (!this.quizData) {
      this.alert.create({
        header: 'Unable to Download',
        message: 'Unable to download this QuizCard set at this time. Please try again later.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }

    // check if quiz exists on device
    this.existingQuiz = await this.sqlite.getQuiz(quiz.id);

    if (this.existingQuiz !== null && this.existingQuiz.id !== undefined) {
      this.alert.create({
        header: 'QuizCard Set Exists',
        message: 'This QuizCard set already exists on your device. Do you want to re-download and overwrite your existing set? This will undo any changes you\'ve made.',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Yes', handler: () => this.updateQuizSet(quiz) }
        ]
      }).then(a => a.present());
    } else {
      await this.addQuizSet(quiz);
    }
  }

  async addQuizSet(quiz: NWQuiz) {

    this._loader = await this.load.create({ message: 'Downloading QuizCard set...' });
    this._loader.present();

    this.importquiz.importQuiz(this.quizData, { networkId: this.quiz.networkId });
    this.importquiz.importCards(this.quizData.quizid, this.quizData.cards);

    this.firestoreService.updateCloudDownloadCount(quiz.networkId, 'network_quizzes');

    this._loader.dismiss();

    this.downloadSuccessAlert();
  }

  async updateQuizSet(quiz: NWQuiz) {
    this._loader = await this.load.create({ message: 'Downloading QuizCard set...' });
    this._loader.present();

    await this.sqlite.updateQuizCardCount(this.existingQuiz, this.quizData.cards.length);
    await this.sqlite.deleteQuizCards(this.existingQuiz.id);
    await this.importquiz.importCards(this.existingQuiz.id, this.quizData.cards);

    this._loader.dismiss();
    this.downloadSuccessAlert();
  }

  downloadSuccessAlert() {
    this.alert.create({
      header: 'Download Success',
      message: 'QuizCard set successfully downloaded to device!',
      buttons: ['OK']
    }).then(a => a.present());
  }
}
