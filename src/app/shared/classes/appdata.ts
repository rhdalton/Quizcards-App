import { Storage } from '@ionic/storage';
import { AppSettings } from '../../models/appsettings';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class AppdataClass {
  appv: number;
  latestdbv: number;

  constructor(
    private storage: Storage) {
    this.appv = 11.25;
    this.latestdbv = 1.4;
  }

  async getAppSettings() {
    const settings: AppSettings = JSON.parse(await this.storage.get('appsettings'));
    if (!settings) {
      const d = new Date();
      const curDate = d.getFullYear() + '-' + (d.getMonth() + 1).toString() + '-' + d.getDate();
      const newSettings: AppSettings = {
        uid: '',
        appVersion: this.appv,
        dbVersion: 1,
        showAnswer: false,
        quizAudio: true,
        rtl: false,
        nightMode: false,
        userStatus: 'personal',
        firstOpen: true,
        syncNotice: true,
        isReset: true,
        appInstallDate: curDate,
        appLastStart: curDate,
        dayDifference: 0,
        studiedTodayCount: 0,
        studiedToday: false
      };
      await this.setAppSettings(newSettings);
      return newSettings;
    }
    return settings;
  }

  async setAppSettings(settings: AppSettings) {
    await this.storage.set('appsettings', JSON.stringify(settings));
  }

  async setLatestVersion() {
    const app = await this.getAppSettings();
    if (app.appVersion !== this.appv) {
      app.appVersion = this.appv;
      this.setAppSettings(app);
    }
  }

  async clearAppSettings() {
    await this.storage.remove('appsettings');
  }

  isPro(userStatus) {
    return (userStatus === 'pro') ? true : false;
  }

  appLimits(rank = '') {
    if (rank === 'pro') {
      return {
        cardLimit: 200,
        cloudLimit: 20
      };
    }
    return {
      cardLimit: 50,
      cloudLimit: 2
    };
  }

  getDateFromString(dateString) {
    return new Date(parseInt(dateString.split('-')[0], 10), parseInt(dateString.split('-')[1], 10) - 1, parseInt(dateString.split('-')[2], 10));
  }
}
