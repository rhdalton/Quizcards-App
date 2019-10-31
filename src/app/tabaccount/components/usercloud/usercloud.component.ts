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
    private toast: ToastNotification
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

  async backupCardSet() {

    // get the quiz to back up
    const quiz: Quiz = await this.sqlite.getQuiz(this._backupId);

    this._loader.dismiss();

    // if cloudId exists, then ask if they want to replace existing backup
    if (quiz.cloudId !== '') {
      this.alert.create({
        header: 'Update Cloud Set',
        message: 'This card set already exists on your cloud account. Do you want to update the cloud set with this one?',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => this.router.navigate(['/tabs/tabmanage/cards', this._backupId]) },
          { text: 'Yes', handler: () => this.syncCardSet(quiz, true) }
        ]
      }).then(a => a.present());
      return;
    }

    // check if user has cloud space for new backup
    const cloudsetCount = (await this.firestore.getUserCloudBackups(this.User.uid)).docs.length;

    // if cloud limit reached, show alert
    if (cloudsetCount >= this._limits.cloudLimit) {
      this.alert.create({
        header: 'Cloud Limit Reached',
        message: 'You have reached your limit of ' + this._limits.cloudLimit + ' Card sets on the cloud. Please upgrade to QuizCards Pro or remove a cloud backup to make space.',
        buttons: ['OK']
      }).then(a => a.present());
      this.router.navigate(['/tabs/tabaccount/usercloud']);
      return;
    }

    // if everything ok, sync set
    this.syncCardSet(quiz);
  }

  async syncCardSet(quiz: Quiz, resync = false) {

    this._loader = await this.load.create({ message: 'Backing up to cloud...' });
    this._loader.present();

    const cloudQuizObj = this.newCloudQuizObj(quiz);

    if (resync) {
      await this.firestore.updateCloudCardSet(cloudQuizObj, 'user_cardsets');
      await this.syncCardSetCards(quiz.cloudId);
    } else {
      const newCloudQuiz = await this.firestore.saveCloudCardSet(cloudQuizObj, 'user_cardsets');
      if (newCloudQuiz.id) {
        await this.sqlite.updateQuizFirestoreId(quiz.id, newCloudQuiz.id, 'cloud');
        await this.syncCardSetCards(newCloudQuiz.id);
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

  async syncCardSetCards(cloudId) {
    const cardsToSync = await this.sqlite.getQuizCards(this._backupId);
    await this.firestore.saveCloudSetCards(cloudId, cardsToSync, 'user_cardsets');
  }

  newCloudQuizObj(quiz: Quiz) {
    return {
      id: quiz.id,
      user_id: this.User.uid,
      quizname: quiz.quizname,
      quizcolor: quiz.quizcolor,
      switchtext: quiz.switchtext,
      cardcount: quiz.cardcount,
      cardview: quiz.cardview,
      isMergeable: quiz.isMergeable,
      isShareable: quiz.isShareable,
      isPurchased: quiz.isPurchased,
      cloudId: (quiz.cloudId) ? quiz.cloudId : '',
      creator_name: quiz.creator_name,
      tts: quiz.tts
    } as FSQuiz;
  }

  async downloadCloudSet(cloudId, quizId) {
    this._loader = await this.load.create({ message: 'Preparing download...' });
    this._loader.present();

    // check if this Card set is on device already
    const deviceQuiz: Quiz = await this.sqlite.getQuiz(quizId);

    this._loader.dismiss();

    if (Object.keys(deviceQuiz).length > 0) {
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

    const cloudCards = (await this.firestore.getCloudSetCards(cloudId, 'user_cardsets'))
      .docs.map(e => {
        return {
          ...e.data()
        } as Card;
      });

    const deviceQuiz: Quiz = {
      ...cloudQuiz,
      isArchived: 0,
      isBackable: 1,
      networkId: '',
      shareId: '',
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

    await this.sqlite.addCards(cloudCards, false);

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

    await this.firestore.deleteCloudSetCards(cloudId, 'user_cardsets');
    await this.firestore.deleteCloudCardSet(cloudId, 'user_cardsets');

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
