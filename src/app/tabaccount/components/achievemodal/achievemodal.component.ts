import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { Achievements } from 'src/app/shared/classes/achievements';

@Component({
  selector: 'quizcards-achievemodal',
  templateUrl: './achievemodal.component.html',
  styleUrls: ['./achievemodal.component.scss'],
})
export class AchievemodalComponent implements OnInit {
  modal;
  a;
  ach;

  constructor(
    private param: NavParams,
    private achieve: Achievements
  ) {
    this.modal = this.param.get('modal');
    this.a = this.param.get('achieveData');
  }

  ngOnInit() {
    this.ach = this.achieve.achievementDetails()[this.a.id];
    if (this.ach.name === 'rainbow' && this.a.rank === 1) {
      this.ach.desc += " (Have a card set with each of the 7 colors.)";
    }
  }
}
