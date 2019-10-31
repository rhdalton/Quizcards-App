import { Component, OnInit } from '@angular/core';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { NavParams, LoadingController, Platform, AlertController } from '@ionic/angular';
import { SqliteService } from 'src/app/services/sqlite.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Quiz } from 'src/app/models/quiz';
import { Card } from 'src/app/models/card';
import { NWCard } from 'src/app/models/nwcard';

@Component({
  selector: 'app-com-download',
  templateUrl: './com-download.component.html',
  styleUrls: ['./com-download.component.scss'],
})
export class ComDownloadComponent implements OnInit {
  _loader;
  modal;
  quiz: NWQuiz;

  constructor(
    private params: NavParams,
    private load: LoadingController,
    private sqlite: SqliteService,
    private firestoreService: FirestoreService,
    private platform: Platform,
    private alert: AlertController
  ) {
    this.modal = this.params.get('modal');
    this.quiz = this.params.get('quiz');
  }

  ngOnInit() {}

  async downloadQuiz(quiz: NWQuiz) {
    this.modal.dismiss();
    // console.log(quiz);

    // check if quiz exists on device
    const quizExist = await this.sqlite.getQuiz(quiz.id);

    if (quizExist !== null && quizExist.id !== undefined) {
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

    const NWcards: NWCard[] = (await this.firestoreService.getCloudSetCards(quiz.networkId, 'network_quizzes'))
                            .docs.map(c => {
                              return {
                                ...c.data()
                              } as NWCard;
                            });

    const newDeviceQuiz: Quiz = this.createDeviceQuizObj(quiz);

    await this.sqlite.addQuiz(newDeviceQuiz);

    const deviceCards = [];

    for (const card of NWcards) {
      const newDeviceCard: Card = this.createDeviceCardObj(card);
      deviceCards.push(newDeviceCard);
    }

    await this.sqlite.addCards(deviceCards);

    this.firestoreService.updateNetworkDownloadCount(quiz.networkId);

    this._loader.dismiss();

    this.downloadSuccessAlert();
  }

  async updateQuizSet(quiz: NWQuiz) {
    this._loader = await this.load.create({ message: 'Downloading QuizCard set...' });
    this._loader.present();

    const NWcards: NWCard[] = (await this.firestoreService.getCloudSetCards(quiz.networkId, 'network_quizzes'))
                            .docs.map(c => {
                              return {
                                ...c.data()
                              } as NWCard;
                            });

    const newDeviceQuiz: Quiz = this.createDeviceQuizObj(quiz);

    await this.sqlite.updateQuiz(newDeviceQuiz);

    const newDeviceCards = [];

    for (const card of NWcards) {
      const newDeviceCard: Card = this.createDeviceCardObj(card);
      newDeviceCards.push(newDeviceCard);
    }
    await this.sqlite.deleteQuizCards(newDeviceQuiz.id);
    await this.sqlite.addCards(newDeviceCards);

    this._loader.dismiss();
    this.downloadSuccessAlert();
  }

  createDeviceQuizObj(quiz: NWQuiz) {
    return {
      ...quiz,
      switchtext: 0,
      cardview: 'compact-view',
      isArchived: 0,
      isMergeable: 0,
      isBackable: 1,
      isShareable: 0,
      isPurchased: (quiz.isPurchase) ? 1 : 0,
      cloudId: '',
      shareId: '',
      networkId: quiz.networkId,
      creator_name: quiz.quizauthor,
      tts: quiz.quiztts,
      ttsaudio: 0,
      quizLimit: 30,
      quizTimer: 0,
      studyShuffle: 0,
      quizShuffle: 1,
      ttsSpeed: 80
    } as Quiz;
  }

  createDeviceCardObj(card: NWCard) {
    return {
      id: card.id,
      quiz_id: card.quiz_id,
      c_text: card.ctext,
      c_subtext: card.csubtext,
      c_image: card.cimage,
      image_path: '',
      c_audio: card.caudio,
      audio_path: '',
      c_video: '',
      c_correct: card.canswer,
      c_study: card.canswer,
      c_substudy: card.csubstudy,
      cardorder: card.cardorder,
      correct_count: 0
    } as Card;
  }

  downloadSuccessAlert() {
    this.alert.create({
      header: 'Success',
      message: 'QuizCard set successfully downloaded!',
      buttons: ['OK']
    }).then(a => a.present());
  }
}
