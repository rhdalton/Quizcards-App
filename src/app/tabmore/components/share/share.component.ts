import { Component, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { ActivatedRoute, Router } from '@angular/router';
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
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss'],
})
export class ShareComponent implements OnInit {
  _userSub: Subscription;
  _quizId: string;
  _isPro = false;
  _app: AppSettings;
  _hasImages = false;
  _hasAudio = false;
  _imageData: any[];
  _imagePathData: any[];
  _loader;
  _currentSharedSet: FSShared;
  User: User;
  Quiz: Quiz;
  shareCode: string;
  shareComplete = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private alert: AlertController,
    private load: LoadingController,
    private firestoreService: FirestoreService,
    private toast: ToastNotification,
    private quizjson: QuizcardsExport
  ) {
    this._quizId = this.route.snapshot.params.quizid;
  }

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

  async ionViewWillEnter() {
    this.shareComplete = false;
    this.Quiz = await this.sqlite.getQuiz(this._quizId);
  }

  async shareToFriends() {

    this._imageData = [];
    this._imagePathData = [];

    // check if cards have images/audio
    const cards: Card[] = await this.sqlite.getQuizCards(this.Quiz.id);
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].c_image && cards[i].c_image !== '') {
        this._hasImages = true;
        this._imagePathData.push(cards[i].image_path);
        this._imageData.push(cards[i].c_image.substr(cards[i].c_image.lastIndexOf('/') + 1));
      }
      if (cards[i].c_audio && cards[i].c_audio !== '') this._hasAudio = true;
    }

    if (!this._isPro && this._hasImages) {
      this.alert.create({
        header: 'Share Image Cards',
        message: 'This QuizCard set contains images. Images can only be shared with a Pro Account. Please upgrade to Pro to share this QuizCard set.',
        buttons: ['OK']
      }).then(a => a.present());
      this.router.navigate(['/tabs/tabmanage/cards', this._quizId]);
      return;
    }

    if (this._hasAudio) {
      if (await this.notifyAudio()) {
        for (let i = 0; i < cards.length; i++) {
          cards[i].c_audio = '';
          cards[i].audio_path = '';
        }
      } else {
        this.toast.loadToast('Share card set canceled.');
        this.router.navigate(['/tabs/tabmanage/cards', this._quizId]);
        return;
      }
    }

    this._loader = await this.load.create({ message: 'Generating share code...' });
    this._loader.present();


    if (!this.Quiz.shareId || this.Quiz.shareId === '') {

      this.uploadNewShareQuiz(cards);

    } else {
      // get current shared quiz if exists
      this._currentSharedSet = (await this.firestoreService.getFirestoreQuiz(this.Quiz.shareId, 'user_shared_cardsets')).data() as FSShared;

      // console.log('shared quiz', sharedQuiz);

      if (!this._currentSharedSet) {

        // if sharequiz not found, then already deleted, treat like new share quiz
        await this.uploadNewShareQuiz(cards);

      } else {
        // else shared quiz found

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
                this.updateCurrentSharedSet(cards);
              }
            }
          ]
        })
        .then(a => a.present());
        return;
      }
    }
  }

  async uploadNewShareQuiz(cards: Card[]) {
    // IF NEW SHARE QUIZ
    this.shareCode = this.makeShareCode(8);

    const newShareQuiz: FSShared = this.createShareQuizObject(cards);

    const sharedSet = await this.firestoreService.saveCloudCardSet(newShareQuiz, 'user_shared_cardsets');
    if (sharedSet.id) {
      await this.sqlite.updateQuizFirestoreId(this.Quiz.id, sharedSet.id, 'share');
      for (let i = 0; i < this._imagePathData.length; i++) {
        this.firestoreService.uploadStorageImage(sharedSet.id, this._imagePathData[i], 'shared');
      }
    }

    this._loader.dismiss();
    this.shareComplete = true;
  }

  async updateCurrentSharedSet(cards: Card[]) {


    this.shareCode = this.makeShareCode(8);
    const updateShareQuiz: FSShared = this.createShareQuizObject(cards);

    await this.firestoreService.updateCloudCardSet(updateShareQuiz, 'user_shared_cardsets');

    // delete images from prev shared imageData NOT in new Synced card set imageData
    const prevImageData = (this._currentSharedSet.imageData) ? JSON.parse(this._currentSharedSet.imageData) : [];
    for (let i = 0; i < prevImageData.length; i++) {
      if (!this._imageData.includes(prevImageData[i])) {
        await this.firestoreService.deleteStorageFile(this.Quiz.shareId, 'shared', prevImageData[i]);
      }
    }

    // upload new images not already in prev shared imageData
    for (let i = 0; i < this._imagePathData.length; i++) {
      const fn = this._imagePathData[i].substr(this._imagePathData[i].lastIndexOf('/') + 1);
      if (!prevImageData.includes(fn)) {
        this.firestoreService.uploadStorageImage(this.Quiz.shareId, this._imagePathData[i], 'shared');
      }
    }


    this._loader.dismiss();
    this.shareComplete = true;
  }

  createShareQuizObject(cards: Card[]) {

    return {
      shareId: (this.Quiz.shareId) ? this.Quiz.shareId : '',
      quizId: this.Quiz.id,
      quizName: this.Quiz.quizname,
      cardCount: this.Quiz.cardcount,
      quizdownloads: 0,
      shareCode: this.shareCode,
      shareUserId: (this.User && this.User.uid) ? this.User.uid : '',
      shareUserName: (this.User && this.User.uid) ? this.User.displayName : '',
      shareTime: firestore.Timestamp.now().seconds,
      shareDatetime: firestore.Timestamp.now().toDate().toString(),
      shareTo: '',
      quizData: this.quizjson.quizToJson(this.Quiz, cards),
      imageData: (this._imageData.length > 0) ? JSON.stringify(this._imageData) : ''
    } as FSShared;
  }

  async notifyAudio() {
    return new Promise((res, rej) => {
      this.alert.create({
        header: 'Audio Cards',
        message: 'This QuizCard set contains audio clips. Audio files cannot be shared. Do you still want to share this set without the audio clips?',
        buttons: [
          { text: "Cancel", role: "cancel", handler: () => res(false) },
          { text: "YES", handler: () => res(true) }
        ]
      }).then(a => a.present());
    });
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
