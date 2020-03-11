import { Component, ViewChild } from '@angular/core';
import { IonTabs, NavController } from '@ionic/angular';
import { PlayAudio } from 'src/app/shared/classes/playaudio';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {

  constructor(
    private navCtrl: NavController,
    private audio: PlayAudio
  ) {}

  async gotoTab(tab) {
    this.audio.endAudio();
    this.navCtrl.navigateRoot('/tabs/' + tab);
  }
}
