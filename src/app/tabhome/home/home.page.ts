import { Component, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { SqliteService } from 'src/app/services/sqlite.service';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { PopoverController, AlertController } from '@ionic/angular';
import { QuiztypeComponent } from '../components/quiztype/quiztype.component';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { Achievements } from 'src/app/shared/classes/achievements';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  Quizzes: Quiz[] = [];
  _homeLoaded = false;

  constructor(
    private sqlite: SqliteService,
    private toast: ToastNotification,
    private pop: PopoverController,
    private alert: AlertController,
    private router: Router,
    private storage: Storage,
    private ach: Achievements
  ) { }

  async ngOnInit() {
    // await this.storage.remove('achievements');
    // this.storage.clear();
    // this.ach.updateLocalAchievement(13, 1);
  }

  async ionViewWillEnter() {
    this.getQuizes();
  }

  async getQuizes() {
    this.Quizzes = await this.sqlite.getQuizzes();
    this._homeLoaded = true;
  }

  doStudy(quizId, cardcount) {
    if (cardcount === 0) {
      this.alert.create({
        header: 'No Cards',
        message: 'No cards for this QuizCard set. Create some before studying.',
        buttons: [{ text: 'OK', handler: () => this.router.navigate(['/tabs/tabmanage/cards', quizId])}]
      }).then(a => a.present());
      return;
    } else {
      this.router.navigate(['/tabs/tabhome/study', quizId]);
    }
  }

  doQuiz(ev, quizId, cardcount) {
    if (cardcount === 0) {
      this.alert.create({
        header: 'No Cards',
        message: 'No cards for this QuizCard set. Create some before quizzing.',
        buttons: [{ text: 'OK', handler: () => this.router.navigate(['/tabs/tabmanage/cards', quizId])}]
      }).then(a => a.present());
      return;
    } else {
      this.quizTypePopover(ev, quizId);
    }
  }

  quizTypePopover(ev, quizId) {
    this.pop.create({
      component: QuiztypeComponent,
      event: ev,
      translucent: true,
      componentProps: {
        popover: this.pop,
        quizid: quizId,
        reload: 1
      },
      cssClass: 'standard-popover quiz-popover'
    }).then(p => p.present());
  }
}
