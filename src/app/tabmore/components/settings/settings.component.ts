import { Component, OnInit } from '@angular/core';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  _app: AppSettings = { uid: '' };

  constructor(
    private app: AppdataClass
  ) {
    this._app.showAnswer = false;
  }

  async ngOnInit() {
    this._app = await this.app.getAppSettings();
  }

  async toggleSetting() {
    await this.app.setAppSettings(this._app);
  }
}
