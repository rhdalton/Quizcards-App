import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AppSettings } from 'src/app/models/appsettings';
import { Card } from 'src/app/models/card';
import { FSQuiz } from 'src/app/models/fsquiz';
import { Quiz } from 'src/app/models/quiz';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { ImageService } from 'src/app/services/images.service';
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';
import { ExportQuiz } from 'src/app/models/exportquiz';

@Component({
  selector: 'app-usercloud',
  templateUrl: './usercloud.component.html',
  styleUrls: ['./usercloud.component.scss'],
})
export class UsercloudComponent implements OnDestroy {
  _userSub: Subscription;
  _app: AppSettings;
  _limits;
  _backupId = '';
  _loader;
  _isPro: boolean;
  _imageData: any;
  _imagePathData: any;
  _currentCloudSet: FSQuiz;
  User: User;
  Quizzes: FSQuiz[];

  constructor(
    private auth: AuthService,
    private app: AppdataClass,
    private sqlite: SqliteService,
    private firestore: FirestoreService,
    private route: ActivatedRoute,
    private load: LoadingController,
    private router: Router,
    private alert: AlertController,
    private toast: ToastNotification,
    private image: ImageService,
    private quizjson: QuizcardsExport
  ) { }

  async ionViewWillEnter() {

    this._backupId = this.route.snapshot.params.backupid;

    if (this._backupId) this._loader = await this.load.create({ message: 'Preparing to back up...' });
    else this._loader = await this.load.create({ message: 'Loading cloud backups...' });

    this._loader.present();

    this._userSub = this.auth.appUser$.subscribe(async (appUser) => {
      if (!appUser) {

        this.User = null;
        this._loader.dismiss();

        if (this._backupId) {
          // check to make sure user logged in
          this.alert.create({
            header: 'Login Required',
            message: 'Please log in to back up card sets to the cloud.',
            buttons: ['OK']
          }).then(a => a.present());
        }
        this.router.navigate(['/tabs/tabaccount']);

      } else {

        this.User = appUser;
        this._limits = this.app.appLimits(this.User.userStatus);
        this._isPro = this.app.isPro(this.User.userStatus);

        if (this._backupId) {
          this.backupCardSet();
        } else {
          this.loadUserCloudSets();
        }
      }
    });
  }

  async loadUserCloudSets() {
    this.Quizzes = (await this.firestore.getUserCloudBackups(this.User.uid))
      .docs.map(e => {
        return {
          ...e.data()
        } as FSQuiz;
      });
    this._loader.dismiss();
  }

  async alertImages() {
    this._loader.dismiss();
    return new Promise(async (res) => {
      const a = await this.alert.create({
        header: 'Set Contains Images',
        message: 'This card set contains images, however images can only be backed-up with Pro Account. Do you want to continue the backup without images?',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => { res(false); this.router.navigate(['/tabs/tabmanage/cards', this._backupId]); } },
          { text: 'Yes', handler: () => res(true) }
        ]
      });
      await a.present();
    });
  }

  async alertAudio() {
    this._loader.dismiss();
    return new Promise(async (res) => {
      const a = await this.alert.create({
        header: 'Set Contains Audio',
        message: 'Audio clips cannot be backed-up on cloud. However, the cards will save the location of audio on local device. ' +
        'If the audio files remain on your device, you will be able to download this card set and still play the audio clips.',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => res(false) },
          { text: 'Continue', handler: () => res(true) }
        ],
        backdropDismiss: false
      });
      await a.present();
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

  async backupCardSet() {

    let hasImages = false;
    let hasAudio = false;
    this._imageData = [];
    this._imagePathData = [];

    // get the quiz to back up
    const quiz: Quiz = await this.sqlite.getQuiz(this._backupId);
    const cardsToSync: Card[] = await this.sqlite.getQuizCards(this._backupId);

    for (let i = 0; i < cardsToSync.length; i++) {
      if (cardsToSync[i].c_image !== '') {
        hasImages = true;
        if (!this._isPro) {
          cardsToSync[i].c_image = '';
          cardsToSync[i].image_path = '';
        } else {
          this._imagePathData.push(cardsToSync[i].image_path);
          this._imageData.push(cardsToSync[i].c_image.substr(cardsToSync[i].c_image.lastIndexOf('/') + 1));
        }
      }
      if (cardsToSync[i].c_audio !== '') hasAudio = true;
    }

    if (!this._isPro && hasImages && !await this.alertImages()) {
      this.router.navigate(['/tabs/tabmanage/cards', this._backupId]);
      return;
    }
    if (hasAudio && !await this.alertAudio()) {
      this.router.navigate(['/tabs/tabmanage/cards', this._backupId]);
      return;
    }

    // check if cloud quiz already exists
    if (quiz.cloudId !== '') {

      this._currentCloudSet = (await this.firestore.getFirestoreQuiz(quiz.cloudId, 'user_cardsets')).data() as FSQuiz;

      if (this._currentCloudSet) {
        this._loader.dismiss();
        this.alert.create({
          header: 'Update Cloud Set',
          message: 'This card set already exists on your cloud account. Do you want to update the cloud set with this one?',
          buttons: [
            { text: 'Cancel', role: 'cancel', handler: () => this.router.navigate(['/tabs/tabmanage/cards', this._backupId]) },
            { text: 'Yes', handler: () => this.syncCardSet(quiz, cardsToSync, true) }
          ]
        }).then(a => a.present());
        return;
      }
    }

    // check if user has cloud space for new backup
    const cloudsetCount = (await this.firestore.getUserCloudBackups(this.User.uid)).docs.length;

    // if cloud limit reached, show alert
    if (cloudsetCount >= this._limits.cloudLimit) {
      this._loader.dismiss();
      this.alert.create({
        header: 'Cloud Limit Reached',
        message: 'You have reached your limit of ' + this._limits.cloudLimit + ' Card sets on the cloud. Please upgrade to QuizCards Pro or remove a cloud backup to make space.',
        buttons: ['OK']
      }).then(a => a.present());
      this.router.navigate(['/tabs/tabaccount/usercloud']);
      return;
    }

    this._loader.dismiss();
    // if everything ok, sync set
    this.syncCardSet(quiz, cardsToSync);
  }

  async syncCardSet(quiz: Quiz, cards: Card[], resync = false) {

    this._loader = await this.load.create({ message: 'Backing up to cloud...' });
    this._loader.present();

    const cloudQuizObj = this.newCloudQuizObj(quiz, cards);

    // IF RESYNC TO CLOUD //
    if (resync) {

      // delete images from prev cloud imageData NOT in new Synced card set imageData
      const prevImageData = (this._currentCloudSet.imageData) ? JSON.parse(this._currentCloudSet.imageData) : [];
      for (let i = 0; i < prevImageData.length; i++) {
        if (!this._imageData.includes(prevImageData[i])) {
          await this.firestore.deleteStorageFile(quiz.cloudId, 'cloud', prevImageData[i]);
        }
      }

      await this.firestore.updateCloudCardSet(cloudQuizObj, 'user_cardsets');

      // upload new images not already in prev cloud imageData
      for (let i = 0; i < this._imagePathData.length; i++) {
        const fn = this._imagePathData[i].substr(this._imagePathData[i].lastIndexOf('/') + 1);
        if (!prevImageData.includes(fn)) {
          this.firestore.uploadStorageImage(quiz.cloudId, this._imagePathData[i], 'cloud');
        }
      }

      // delete cards sub-collection from old cardset structure
      this.firestore.deleteCloudSetCards(quiz.cloudId, 'user_cardsets');

    } else {
    // ELSE NEW BACKUP TO CLOUD //

      const newCloudQuiz = await this.firestore.saveCloudCardSet(cloudQuizObj, 'user_cardsets');
      if (newCloudQuiz.id) {
        await this.sqlite.updateQuizFirestoreId(quiz.id, newCloudQuiz.id, 'cloud');
        // upload images to cloud storage
        for (let i = 0; i < this._imagePathData.length; i++) {
          this.firestore.uploadStorageImage(newCloudQuiz.id, this._imagePathData[i], 'cloud');
        }
      }
    }

    this._loader.dismiss();
    this.alert.create({
      header: 'Backup Success',
      message: 'Card set successfully synced to the cloud! You can download it to any device by going to "Account" > "Manage Cloud Backups"',
      buttons: ['OK']
    }).then(a => a.present());
    this.router.navigate(['/tabs/tabmanage/cards', this._backupId]);
  }

  async syncCardSetCards(cloudId, cards) {
    const saveImages = (this.User.userStatus === 'pro') ? true : false;
    await this.firestore.saveCloudSetCards(cloudId, cards, 'user_cardsets', saveImages);
  }

  newCloudQuizObj(quiz: Quiz, cards: Card[]) {
    return {
      user_id: this.User.uid,
      user_name: this.User.displayName,
      cloudId: (quiz.cloudId) ? quiz.cloudId : '',
      quizId: quiz.id,
      quizname: quiz.quizname,
      quizcolor: quiz.quizcolor,
      cardcount: quiz.cardcount,
      isMergeable: quiz.isMergeable,
      isShareable: quiz.isShareable,
      isPurchased: quiz.isPurchased,
      quizData: this.quizjson.quizToJson(quiz, cards),
      imageData: (this._imageData.length === 0) ? '' : JSON.stringify(this._imageData)
    } as FSQuiz;
  }

  async downloadCloudSet(cloudId, quizId) {
    this._loader = await this.load.create({ message: 'Preparing download...' });
    this._loader.present();

    // check if this Card set is on device already
    const deviceQuiz: Quiz = await this.sqlite.getQuiz(quizId);

    this._loader.dismiss();

    if (Object.keys(deviceQuiz).length > 0 && deviceQuiz.cloudId !== '') {
      this.alert.create({
        header: 'Card Set Exists',
        message: 'This card set already exists on your device. Do you want to download and replace the card set on your device?',
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Yes', handler: () => this.doDownloadCardSet(deviceQuiz.cloudId, true) }
        ]
      }).then(a => a.present());
      return;
    }

    this.doDownloadCardSet(cloudId);
  }

  async doDownloadCardSet(cloudId, update = false) {
    this._loader = await this.load.create({ message: 'Downloading card set...' });
    this._loader.present();

    const cloudQuiz = (await this.firestore.getFirestoreQuiz(cloudId, 'user_cardsets')).data() as FSQuiz;
    if (!cloudQuiz) {
      this._loader.dismiss();
      return;
    }

    if (cloudQuiz.imageData && cloudQuiz.imageData !== '') {
      if (!await this.alertData()) {
        return;
      } else {
        this._loader = await this.load.create({ message: 'Downloading card set...' });
        this._loader.present();
      }
    }

    const deviceQuiz: Quiz = {
      id: (cloudQuiz.quizId) ? cloudQuiz.quizId : cloudQuiz.id,
      cloudId: cloudQuiz.cloudId,
      creator_name: cloudQuiz.user_name,
      quizname: cloudQuiz.quizname,
      quizcolor: cloudQuiz.quizcolor,
      cardcount: cloudQuiz.cardcount,
      cardview: 'detail-view',
      switchtext: 0,
      isArchived: 0,
      isBackable: 1,
      isMergeable: cloudQuiz.isMergeable,
      isShareable: cloudQuiz.isShareable,
      isPurchased: cloudQuiz.isPurchased,
      networkId: '',
      shareId: '',
      tts: '',
      ttsaudio: 0,
      quizLimit: 30,
      quizTimer: 0,
      studyShuffle: 0,
      quizShuffle: 1,
      ttsSpeed: 80
    };

    if (update) {
      await this.sqlite.updateCloudQuiz(deviceQuiz);
      await this.sqlite.deleteQuizCards(deviceQuiz.id);
    } else {
      await this.sqlite.addQuiz(deviceQuiz);
    }

    if (cloudQuiz.quizData && cloudQuiz.quizData !== '') {
      // download images from quizData json
      const quizjson = JSON.parse(cloudQuiz.quizData) as ExportQuiz;
      if (this._isPro) quizjson.cards = await this.image.downloadImagesFromCloudStorageJson(cloudId, quizjson.cards, 'cloud');
      this.quizjson.importCards(deviceQuiz.id, quizjson.cards);
    } else {
      // ELSE IF DOWNLOADING OLD QUIZ FORMAT
      const cloudCards = (await this.firestore.getCloudSetCards(cloudId, 'user_cardsets'))
      .docs.map(e => {
        return {
          ...e.data()
        } as Card;
      });
      await this.sqlite.addCards(cloudCards, false);
    }

    this._loader.dismiss();
    this.toast.loadToast('Card Set has been downloaded!');
  }

  deleteCloudSetAlert(cloudId, quizId) {
    this.alert.create({
      header: 'Delete Card Set',
      message: 'Are you sure you want to delete this Card Set from the cloud? This action cannot be un-done.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Yes', handler: () => this.deleteCloudSet(cloudId, quizId) }
      ]
    }).then(a => a.present());
  }

  async deleteCloudSet(cloudId, quizId) {
    console.log('delete cloud set');
    this._loader = await this.load.create({ message: 'Deleting cloud card set...' });
    this._loader.present();

    await this.sqlite.updateQuizFirestoreId(quizId, '', 'cloud');

    const cloudQuiz = (await this.firestore.getFirestoreQuiz(cloudId, 'user_cardsets')).data() as FSQuiz;

    if (!cloudQuiz.quizData || cloudQuiz.quizData === '') {
      await this.firestore.deleteCloudSetCards(cloudId, 'user_cardsets');
    }

    await this.firestore.deleteCloudCardSet(cloudId, 'user_cardsets');

    if (cloudQuiz.imageData && cloudQuiz.imageData !== '') {
      const imgData = JSON.parse(cloudQuiz.imageData);
      for (let i = 0; i < imgData.length; i++) {
        this.firestore.deleteStorageFile(cloudId, 'cloud', imgData[i]);
      }
    }

    for (let i = 0; i < this.Quizzes.length; i++) {
      if (this.Quizzes[i].cloudId === cloudId) {
        this.Quizzes.splice(i, 1);
        break;
      }
    }
    this._loader.dismiss();
    this.toast.loadToast('Card set successfully deleted.');
  }

  ngOnDestroy() {
    this._userSub.unsubscribe();
  }
}
