import { Component, OnInit } from '@angular/core';
import { AppdataClass } from '../shared/classes/appdata';
import { AppSettings } from '../models/appsettings';
import { Router } from '@angular/router';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-tabmore',
  templateUrl: './tabmore.page.html',
  styleUrls: ['./tabmore.page.scss'],
})
export class TabmorePage implements OnInit {
  _app: AppSettings;
  isPro = false;

  constructor(
    private app: AppdataClass,
    private router: Router,
    private network: NetworkService
  ) { }

  ngOnInit() { }

  async ionViewWillEnter() {
    this._app = await this.app.getAppSettings();
    this.isPro = this.app.isPro(this._app.userStatus);
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
