import { Component, OnInit } from '@angular/core';
import { Achievements } from 'src/app/shared/classes/achievements';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';
import { ModalController } from '@ionic/angular';
import { AchievemodalComponent } from '../achievemodal/achievemodal.component';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.scss'],
})
export class BadgesComponent implements OnInit {
  _app: AppSettings;
  achievementText;
  userAchievementData;
  achievementsList = [];

  constructor(
    private achieve: Achievements,
    private app: AppdataClass,
    private modal: ModalController
  ) { }

  async ngOnInit() {
    this.userAchievementData = await this.achieve.getAchievements();
    this.achievementText = this.achieve.achievementDetails();
    this._app = await this.app.getAppSettings();

    // this.setRank4();
    // console.log(this.userAchievementData);
    for (const a of this.userAchievementData) {
      if (!this.achievementText[a.id].hidden) {
        this.achievementsList.push({
          id: a.id,
          title: (a.rank === 0) ?
            this.achievementText[a.id].title :
            (this.achievementText[a.id].badges[a.rank - 1].secret) ?
            this.achievementText[a.id].badges[a.rank - 1].secret :
            this.achievementText[a.id].badges[a.rank - 1].title,
          rank: a.rank,
          maxrank: this.achievementText[a.id].badges.length,
          image: this.achievementText[a.id].name,
          badges: this.achievementText[a.id].badges
        });
      }
    }
  }

  achieveDetails(aid) {
    this.modal.create({
      component: AchievemodalComponent,
      componentProps: {
        modal: this.modal,
        achieveData: this.achievementsList.find(x => x.id === aid)
      },
      cssClass: 'download-modal'
    }).then(m => m.present());
  }

  setPro() {
    this.userAchievementData[0].count = 1;
    this.userAchievementData[0].rank = 1;
    this.achieve.saveAchievements(this.userAchievementData);
  }
  unsetPro() {
    this.userAchievementData[0].count = 0;
    this.userAchievementData[0].rank = 0;
    this.achieve.saveAchievements(this.userAchievementData);
  }
  setRank4() {
    this.userAchievementData[3].count = 1;
    this.userAchievementData[3].rank = 4;
    this.achieve.saveAchievements(this.userAchievementData);
  }
}
