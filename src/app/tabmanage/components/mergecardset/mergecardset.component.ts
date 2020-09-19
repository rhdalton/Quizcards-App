import { Component, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { NavParams, AlertController } from '@ionic/angular';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { Router } from '@angular/router';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { Quizdata } from 'src/app/services/quizdata.service';

@Component({
  selector: 'app-mergecardset',
  templateUrl: './mergecardset.component.html',
  styleUrls: ['./mergecardset.component.scss'],
})
export class MergecardsetComponent implements OnInit {
  Quizzes: Quiz[];
  _userStatus: string;
  _limits: any;
  _quizId: string;
  _modal: any;
  _cardcount: number;

  constructor(
    private params: NavParams,
    private sqlite: SqliteService,
    private alert: AlertController,
    private router: Router,
    private toast: ToastNotification,
    public quizdata: Quizdata
  ) {
    this._modal = this.params.get('modal');
    this._userStatus = this.params.get('userStatus');
    this._limits = this.params.get('limits');
    this._quizId = this.params.get('quizId');
    this._cardcount = this.params.get('cardcount');
  }

  async ngOnInit() {

    const allquizes = await this.sqlite.getQuizzes();
    for (let i = 0; i < allquizes.length; i++) {
      if (allquizes[i].id === this._quizId) {
        allquizes.splice(i, 1);
        this.Quizzes = allquizes;
        break;
      }
    }
  }

  async mergeAlert(quiz: Quiz) {
    if (this._cardcount + quiz.cardcount > this._limits.cardLimit) {
      let msg = 'The merged card set cannot have more than the Personal limit of ' + this._limits.cardLimit + ' cards. Upgrade your account to Pro version to increase your card limit.';
      if (this._userStatus === 'pro') msg = 'Card sets have a limit of ' + this._limits.cardLimit + ' cards to ensure best app performance. Try creating a new set.';
      this.alert.create({
        header: 'Card Limit',
        message: msg,
        buttons: ['OK']
      }).then(a => a.present());
    } else {
      this.alert.create({
        header: 'Merge Sets',
        message: 'This will take the cards from the current set and move them to "' + quiz.quizname + '".',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => {} },
          { text: 'Yes', handler: () => { this.merge(quiz); } }
        ]
      }).then(a => a.present());
    }
  }

  async merge(quiz: Quiz) {
    this._modal.dismiss();
    this.sqlite.mergeCardSets(this._quizId, quiz.id, this._cardcount, quiz.cardcount);
    this.quizdata.updateQuizcount(this._cardcount + quiz.cardcount);
    this.quizdata.updateCount = true;
    this.toast.loadToast('Card set merge successful.');
    this.router.navigate(['/tabs/tabmanage/cards', quiz.id]);
  }

  close() {
    this._modal.dismiss();
  }
}
