import { Component, OnInit } from '@angular/core';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';
import { ToastNotification } from 'src/app/shared/classes/toast';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  _app: AppSettings = { uid: '' };

  constructor(
    private app: AppdataClass,
    private toast: ToastNotification
  ) {
    this._app.showAnswer = false;
    this._app.multiChoiceNum = 4;
  }

  async ngOnInit() {
    this._app = await this.app.getAppSettings();
    // this._app.multiChoiceNum = undefined;
    // this.toggleSetting();
    // return;
    console.log('multi', this._app.multiChoiceNum);
    if (this._app.multiChoiceNum === undefined) {
      this._app.multiChoiceNum = 4;
      console.log(this._app.multiChoiceNum);
    }
  }

  async setMultiChoice(event) {
    console.log(event);
    this._app.multiChoiceNum = event.detail.value;
    await this.app.setAppSettings(this._app);
    this.changeUpdated();
  }

  async toggleSetting() {
    await this.app.setAppSettings(this._app);
    this.changeUpdated();
  }

  changeUpdated() {
    this.toast.loadToast('Setting has been updated.');
  }
}
