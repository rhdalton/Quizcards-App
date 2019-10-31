import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../models/user';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { LoadingController } from '@ionic/angular';
import { AppSettings } from '../models/appsettings';
import { AppdataClass } from '../shared/classes/appdata';
import { Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { Achievements } from '../shared/classes/achievements';
import { NetworkService } from '../services/network.service';
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-tabaccount',
  templateUrl: './tabaccount.page.html',
  styleUrls: ['./tabaccount.page.scss'],
})
export class TabaccountPage implements OnInit, OnDestroy {
  User: User;
  appBadges;
  userBadges = [];
  _loader;
  _app: AppSettings;
  _userSub: Subscription;
  joinTime: string;
  accountPageLoaded = false;
  isPro = false;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private app: AppdataClass,
    private fs: FirestoreService,
    private load: LoadingController,
    private ach: Achievements,
    private network: NetworkService
  ) { }

  async ngOnInit() {
    this._loader = await this.load.create({ message: 'Checking account status...' });
    this._loader.present();
    this._app = await this.app.getAppSettings();
    this.appBadges = await this.ach.getAchievements();

    this._userSub = this.auth.appUser$.subscribe(async (appUser) => {
      if (!appUser) {
        this.User = null;
        this._app.uid = '';
        this._app.userStatus = 'personal';
      } else {
        this.User = appUser;

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const jt = this.User.registerDate ? this.User.registerDate : '2019-03-30';
        this.joinTime = monthNames[parseInt(jt.split("-")[1], 10) - 1] + " " + jt.split("-")[0];

        const d = new Date();
        const datetime =  d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        if (this.User.lastActive !== datetime || this.User.appVersion < this._app.appVersion) {
          this.userService.save(this.User.uid, datetime);

          if (this.appBadges[1].count === 0) {
            const sDate = this.app.getDateFromString(this.User.registerDate);
            const eDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            console.log(diffDays);
            this.ach.updateLocalAchievement(2, diffDays);
          }
        }

        this._app.userStatus = this.User.userStatus;
        this._app.uid = this.User.uid;
        this.isPro = this.app.isPro(this.User.userStatus);

        if (this.isPro && this.appBadges[0].rank === 0) {
          await this.ach.updateLocalAchievement(1, 1);
        }

        this.setUserBadges();
      }
      this.app.setAppSettings(this._app);
      console.log('user status set: ', this._app.userStatus);

      this._loader.dismiss();
      this.accountPageLoaded = true;
    });

  }

  async ionViewWillEnter() {
    if (!this.network.isOnline()) {
      this._loader.dismiss();
      this.network.alertOffline('access account features');
      return;
    }
    this.appBadges = await this.ach.getAchievements();
    this.setUserBadges();
  }

  ngOnDestroy() {
    console.log('unsub user');
    this._userSub.unsubscribe();
  }

  setUserBadges() {
    this.userBadges = [];
    for (let i = 0; i < this.appBadges.length; i++) {
      if (this.appBadges[i].rank > 0) {
        this.userBadges.push({
          id: this.appBadges[i].id,
          rank: this.appBadges[i].rank,
          image: this.ach.achievementDetails()[this.appBadges[i].id].name,
          maxrank: this.ach.achievementDetails()[this.appBadges[i].id].badges.length
        });
      }
    }
  }

  dismissSyncNotice() {
    this._app.syncNotice = true;
    this.app.setAppSettings(this._app);
  }

  async logOut() {
    this._loader = await this.load.create({ message: 'Logging out...'});
    this._loader.present();
    // await this.fs.setAchievements(this.User, this.userBadges);
    this.auth.logOut();
    this._loader.dismiss();
  }
}
