import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { Achievements } from '../../classes/achievements';
import { AppdataClass } from '../../classes/appdata';

@Component({
  selector: 'quizcards-achievealert',
  templateUrl: './achievealert.component.html',
  styleUrls: ['./achievealert.component.scss'],
})
export class AchievealertComponent implements OnInit {
  modal;
  achdata;
  achdetails;
  newtitle;
  image;
  maxrank;
  desc;
  rankdesc;
  user;
  alertLoaded;

  constructor(
    private params: NavParams,
    private app: AppdataClass
  ) {
    this.modal = this.params.get('modal');
    this.achdata = this.params.get('achdata');
    this.achdetails = this.params.get('achdetails');
  }

  async ngOnInit() {
    this.user = await this.app.getAppSettings();
    this.newtitle = (this.achdetails[this.achdata.id].badges[this.achdata.rank - 1].secret) ?
      this.achdetails[this.achdata.id].badges[this.achdata.rank - 1].secret :
      this.achdetails[this.achdata.id].badges[this.achdata.rank - 1].title;
    this.image = this.achdetails[this.achdata.id].name;
    this.maxrank = this.achdetails[this.achdata.id].badges.length;
    this.desc = (this.achdetails[this.achdata.id].badges[this.achdata.rank - 1].secret) ?
      'Have a card set with each of the 7 colors.' :
      this.achdetails[this.achdata.id].desc;
    this.rankdesc = this.achdetails[this.achdata.id].badges[this.achdata.rank - 1].desc;
    this.alertLoaded = true;
  }

}
