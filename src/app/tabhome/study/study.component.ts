import { Component, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { SqliteService } from 'src/app/services/sqlite.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Card } from 'src/app/models/card';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';
import { animate, style, transition, trigger } from '@angular/animations';
import 'hammerjs';
import { PopoverController, Platform, AlertController } from '@ionic/angular';
import { QuiztypeComponent } from '../components/quiztype/quiztype.component';
import { QuizClass } from 'src/app/shared/classes/quiz';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { Achievements } from 'src/app/shared/classes/achievements';
import { PlayAudio } from 'src/app/shared/classes/playaudio';

@Component({
  selector: 'app-study',
  templateUrl: './study.component.html',
  styles: [],
  animations: [
    trigger('animateCard', [
      transition(':increment', animate('200ms', style({ transform: 'translateX(-110%)' }))),
      transition(':decrement', animate('200ms', style({ transform: 'translateX(110%)' })))
    ])
  ]
})
export class StudyComponent implements OnInit {
  _app: AppSettings;
  _viewAnswer: boolean;
  _audioActive = false;
  _cardCountSwipe = 0;
  reload = '';
  fontsize = '';
  qcardsize = '';
  quizId: string;
  Quiz: Quiz;
  currentcard = 1;
  Cards: Card[];
  Card: Card;
  slideCards: Card[];
  studyFinished = false;
  audioActive = false;
  studyCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private pop: PopoverController,
    private platform: Platform,
    private quizClass: QuizClass,
    private toast: ToastNotification,
    private ach: Achievements,
    private audio: PlayAudio,
    private alert: AlertController
  ) {
    this.quizId = this.route.snapshot.params.quizid;
    this.reload = this.route.snapshot.params.rl || '';
  }

  ngOnInit() {}

  async ionViewWillEnter() {
    this._app = await this.app.getAppSettings();

    this._viewAnswer = this._app.showAnswer;
    this.Quiz = await this.sqlite.getQuiz(this.quizId);
    if (this.Quiz) {

      this.qcardsize = this.quizClass.setQcardSize(this.Quiz.switchtext);
      this.Cards = await this.sqlite.getQuizCards(this.Quiz.id);
      // remove hidden cards from set
      this.Cards = this.Cards.filter((card) => {
        return card.is_hidden !== 1;
      });

      if (this.Cards.length > 0) this.loadStudy();
      else {
        this.alert.create({
          header: 'No Study Cards',
          message: 'No cards avaliable to study. Check to make sure all cards are not "hidden".',
          buttons: [
            { text: 'OK' }
          ]
        }).then(a => a.present());
        this.router.navigate(['/tabs/tabhome']);
      }
    }
  }

  async ionViewWillLeave() {
    console.log(this.studyCount);
    if (this.studyCount > 0) {
      this.ach.updateLocalAchievement(4, this.studyCount);
      if (this._app.studiedTodayCount + this.studyCount >= 10 && !this._app.studiedToday) {

        if (this._app.dayDifference <= 1) {
          this.ach.updateLocalAchievement(3, 1);
        } else {
          this.ach.resetLocalAchievement(3);
        }
        this._app.studiedToday = true;
      } else {
        this._app.studiedTodayCount += this.studyCount;
      }
      await this.app.setAppSettings(this._app);
    }
  }

  async loadStudy() {
    if (this.Quiz.studyShuffle === 1) this.Cards = this.randomSortArray(this.Cards);
    this.Card = this.Cards[0];
    this.slideCards = this.Cards.slice(0, 2);
    this.currentcard = 1;
    this.studyFinished = true;
    this.setFontSize();
  }

  async nextCard() {
    this.audio.endAudio();
    if (this._app.rtl) this._cardCountSwipe--;
    else this._cardCountSwipe++;
    await this.delay(200);
    if (!this._app.showAnswer) this._viewAnswer = false;
    this.studyCount++;
    if (this.Cards[this.currentcard]) {
      this.Card = this.Cards[this.currentcard];
      this.currentcard++;
      this.setFontSize();

    } else {
      this.Card = null;
      this.studyFinished = true;
    }
  }

  async prevCard() {
    this.audio.endAudio();
    if (this.currentcard === 1) return;
    if (this._app.rtl) this._cardCountSwipe++;
    else this._cardCountSwipe--;
    await this.delay(200);
    if (!this._app.showAnswer) this._viewAnswer = false;
    this.currentcard--;
    this.Card = this.Cards[this.currentcard - 1];
    this.setFontSize();
  }

  quizTypePopover(ev) {
    this.pop.create({
      component: QuiztypeComponent,
      event: ev,
      componentProps: {
        popover: this.pop,
        quizid: this.quizId
      },
      cssClass: 'standard-popover quiz-popover'
    }).then(p => p.present());
  }

  swipeCard(event) {
    if (event.direction === 2) {
      if (this._app.rtl) this.prevCard();
      else this.nextCard();
    } else if (event.direction === 4) {
      if (this._app.rtl) this.nextCard();
      else this.prevCard();
    }
  }

  async hideCard(card: Card) {
    await this.sqlite.hideCard(card.id, this.quizId);

    this.alert.create({
      header: 'Card Hidden',
      message: 'This card has been hidden and will no longer appear in Study & Quiz modes. You will still be able to see it in Edit mode.',
      buttons: [
        { text: 'OK' }
      ]
    }).then(a => a.present());
  }

  editCard(cardId) {
    this.audio.endAudio();
    this.router.navigate(['/tabs/tabmanage/card/', this.quizId, cardId]);
  }

  setFontSize() {
    this.fontsize = (this.Quiz.switchtext === 1) ?
      this.quizClass.setFontSize(this.Card.c_correct, this.Card.c_image) :
      this.quizClass.setFontSize(this.Card.c_text, this.Card.c_image);
  }

  randomSortArray(array) {
    return array.concat().sort(() => 0.5 - Math.random());
  }

  showAnswer() {
    this._viewAnswer = true;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
