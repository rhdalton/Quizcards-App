import { Component, OnInit } from '@angular/core';
import { AppdataClass } from '../shared/classes/appdata';
import { AppSettings } from '../models/appsettings';
import { Router } from '@angular/router';
import { NetworkService } from '../services/network.service';
import { FirestoreService } from '../services/firestore.service';

@Component({
  selector: 'app-tabmore',
  templateUrl: './tabmore.page.html',
  styleUrls: ['./tabmore.page.scss'],
})
export class TabmorePage implements OnInit {
  app: AppSettings;
  isPro = false;
  latestNews: any = {};

  constructor(
    private _app: AppdataClass,
    private router: Router,
    private network: NetworkService,
    private firebase: FirestoreService
  ) { }

  async ngOnInit() {
    if (this.network.isOnline()) {
      const ls = await this.firebase.getLatestNews();
      this.latestNews = JSON.parse(ls);
      console.log(this.latestNews);
    }
  }

  async ionViewWillEnter() {
    this.app = await this._app.getAppSettings();
    this.isPro = this._app.isPro(this.app.userStatus);
  }

  gotoCommunity() {
    if (!this.network.isOnline()) {
      this.network.alertOffline('access QuizCards community');
      return;
    }
    this.router.navigate(["/tabs/tabmore/community"]);
  }

  gotoSharecode() {
    if (!this.network.isOnline()) {
      this.network.alertOffline('download a shared card set');
      return;
    }
    this.router.navigate(["/tabs/tabmore/sharecode"]);
  }
}
