import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SqliteService } from './services/sqlite.service';
import { AppdataClass } from './shared/classes/appdata';
import { Router } from '@angular/router';
import { ToastNotification } from './shared/classes/toast';
import { Achievements } from './shared/classes/achievements';
import { PlayAudio } from 'src/app/shared/classes/playaudio';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  closeapp = 0;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private router: Router,
    private toast: ToastNotification,
    private ach: Achievements,
    private audio: PlayAudio
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(async () => {

      const appsettings = await this.app.getAppSettings();
      document.documentElement.dir = (appsettings.rtl) ? 'rtl' : 'ltr';

      if (!appsettings.isReset) {
        const oldSettings = Object.assign({}, appsettings) as any;
        await this.app.clearAppSettings();
        appsettings.appVersion = oldSettings.appversion;
        appsettings.dbVersion = oldSettings.dbversion;
        appsettings.showAnswer = oldSettings.showAnswer;
        appsettings.quizAudio = oldSettings.quizAudio;
        appsettings.rtl = oldSettings.rtl;
        appsettings.nightMode = false;
        appsettings.userStatus = 'personal';
        appsettings.firstOpen = false;
        appsettings.syncNotice = true;
        appsettings.isReset = true;
        this.app.setAppSettings(appsettings);
        console.log('app settings updated');
      }

      const d = new Date();
      const curDate = d.getFullYear() + '-' + (d.getMonth() + 1).toString() + '-' + d.getDate();

      if (!appsettings.appInstallDate) {
        appsettings.appInstallDate = curDate;
        appsettings.appLastStart = curDate;
        appsettings.dayDifference = 0;
        appsettings.studiedTodayCount = 0;
        appsettings.studiedToday = false;
        this.app.setAppSettings(appsettings);
      }

      if (appsettings.appLastStart !== curDate) {
        const sDate = this.app.getDateFromString(appsettings.appLastStart);

        const eDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        appsettings.appLastStart = curDate;
        appsettings.dayDifference = diffDays;
        appsettings.studiedTodayCount = 0;
        appsettings.studiedToday = false;
        this.app.setAppSettings(appsettings);
        this.ach.updateLocalAchievement(2, diffDays);
      }

      this.app.setLatestVersion();
      if (this.platform.is('cordova')) {
        this.statusBar.styleDefault();
        this.splashScreen.hide();
        this.sqlite.createQuizCardsTables();
      }

      this.platform.backButton.subscribe(async () => {
        this.audio.endAudio();
        if (this.router.url !== '/tabs/tabhome') this.router.navigate(['/tabs/tabhome']);
        else if (this.closeapp === 0) {
          this.closeapp++;
          this.toast.loadToast('Tap again to close app.');
          setTimeout(() => { this.closeapp = 0; }, 2000);
        } else {
          navigator['app'].exitApp();
        }
      });
    });
  }
}
