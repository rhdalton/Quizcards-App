import { Component, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { ActivatedRoute } from '@angular/router';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';
import { AlertController, LoadingController } from '@ionic/angular';
import { Card } from 'src/app/models/card';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FSShared } from 'src/app/models/fsshared';
import { firestore } from 'firebase/app';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { ToastNotification } from 'src/app/shared/classes/toast';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss'],
})
export class ShareComponent implements OnInit {
  _quizId: string;
  _isPro = false;
  _app: AppSettings;
  _hasImages = false;
  _loader;
  User: User;
  Quiz: Quiz;
  shareCode: string;
  shareComplete = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private alert: AlertController,
    private load: LoadingController,
    private firestoreService: FirestoreService,
    private toast: ToastNotification
  ) {
    this._quizId = this.route.snapshot.params.quizid;
  }

  ngOnInit() {
    this.auth.appUser$.subscribe(appUser => {
      if (!appUser) this.User = null;
      else {
        this.User = appUser;
        this._isPro = this.app.isPro(this.User.userStatus);
      }
    });
  }

  async ionViewWillEnter() {
    this.shareComplete = false;
    this.Quiz = await this.sqlite.getQuiz(this._quizId);
  }

  async shareToFriends() {

    // check if user is Pro, if not, check if cards have images
    const cards: Card[] = await this.sqlite.getQuizCards(this.Quiz.id);
    if (!this._isPro) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].c_image && cards[i].c_image !== '') {
          this._hasImages = true;
          break;
        }
      }
    }

    if (this._hasImages) {
      this.alert.create({
        header: 'Pro Account Required',
        message: 'Only QuizCard Pro accounts can share Cards with images. Please upgrade to Pro to share this QuizCard set.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }

    this._loader = await this.load.create({ message: 'Generating share code...' });
    this._loader.present();


    if (!this.Quiz.shareId || this.Quiz.shareId === '') {

      this.uploadNewShareQuiz(cards);

    } else {
      // get current shared quiz if exists
      const sharedQuiz = (await this.firestoreService.getFirestoreQuiz(this.Quiz.shareId, 'user_shared_quizzes')).data() as FSShared;

      console.log('shared quiz', sharedQuiz);

      if (!sharedQuiz) {

        // if sharequiz not found, then already deleted, treat like new share quiz
        this.uploadNewShareQuiz(cards);

      } else {
        // else shared quiz found
        const expiredTime = firestore.Timestamp.now().seconds - 172800; // 48 hrs in seconds

        if (sharedQuiz.sharetime > expiredTime) {

          this._loader.dismiss();
          // active shared quiz found, ask if they want to update it
          console.log('active shared quiz found');
          this.alert.create({
            header: 'Already Sharing',
            message: 'This QuizCard Set is already being shared. Do you want to update & re-share this Set? This will create a new Share Code that you\'ll need to send to your friends.',
            buttons: [
              { text: 'Cancel', role: 'cancel' },
              { text: 'Yes', handler: async () => {
                  this._loader = await this.load.create({ message: 'Updating shared set...' });
                  this._loader.present();
                  this.updateCurrentSharedSet(sharedQuiz);
                }
              }
            ]
          })
          .then(a => a.present());
          return;

        } else {
          // share quiz exipred, update new share
          this.updateCurrentSharedSet(sharedQuiz);
        }
      }
    }
  }

  async uploadNewShareQuiz(cards: Card[]) {
    // IF NEW SHARE QUIZ
    this.shareCode = this.makeShareCode(8);
    const newShareQuiz: FSShared = this.createShareQuizObject(this.Quiz);

    const sharedSet = await this.firestoreService.saveCloudCardSet(newShareQuiz, 'user_shared_quizzes');
    if (sharedSet.id) {
      this.firestoreService.saveCloudSetCards(sharedSet.id, cards, 'user_shared_quizzes', true);
      await this.sqlite.updateQuizFirestoreId(this.Quiz.id, sharedSet.id, 'share');
    }

    this._loader.dismiss();
    this.shareComplete = true;
  }

  async updateCurrentSharedSet(sharedQuiz: FSShared) {

    const cards = await this.sqlite.getQuizCards(sharedQuiz.id);

    this.shareCode = this.makeShareCode(8);
    const updateShareQuiz: FSShared = this.createShareQuizObject(sharedQuiz);

    await this.firestoreService.updateCloudCardSet(updateShareQuiz, 'user_shared_quizzes');
    await this.firestoreService.saveCloudSetCards(sharedQuiz.shareId, cards, 'user_shared_quizzes', true);

    this._loader.dismiss();
    this.shareComplete = true;
  }

  createShareQuizObject(quiz: any) {
    return {
      id: quiz.id,
      quizname: quiz.quizname,
      quizcolor: quiz.quizcolor,
      cardcount: quiz.cardcount,
      tts: quiz.tts,
      sharecode: this.shareCode,
      userId: (this.User.uid) ? this.User.uid : '',
      quizdownloads: 0,
      shareId: (quiz.shareId) ? quiz.shareId : '',
      sharetime: firestore.Timestamp.now().seconds,
      sharedatetime: firestore.Timestamp.now().toDate().toString(),
      creator_name: (this.User.uid) ? this.User.displayName : '',
      share_to: ''
    } as FSShared;
  }

  async copytoclipboard() {
    const el = document.getElementById('sharecode') as HTMLInputElement;
    console.log(el.value);
    el.select();
    document.execCommand('copy');
    this.toast.loadToast('Code copied to clipboard.', 3);
  }

  makeShareCode(len) {
    let code = "";
    const possible = "abcdefghjklmnopqrstuvwxyz123456789";
    for (let i = 0; i < len; i++) code += possible.charAt(Math.floor(Math.random() * possible.length));
    return code;
  }
}
