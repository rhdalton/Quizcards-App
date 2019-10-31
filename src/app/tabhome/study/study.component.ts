import { Component, OnInit, Injectable } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { SqliteService } from 'src/app/services/sqlite.service';
import { ActivatedRoute } from '@angular/router';
import { Card } from 'src/app/models/card';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';
import { animate, style, transition, trigger } from '@angular/animations';
import 'hammerjs';
import { PopoverController, Platform } from '@ionic/angular';
import { QuiztypeComponent } from '../components/quiztype/quiztype.component';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { QuizClass } from 'src/app/shared/classes/quiz';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { Achievements } from 'src/app/shared/classes/achievements';

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
  studyFinished = false;
  audioActive = false;
  studyCount = 0;

  constructor(
    private route: ActivatedRoute,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private pop: PopoverController,
    private platform: Platform,
    private tts: TextToSpeech,
    private quizClass: QuizClass,
    private toast: ToastNotification,
    private ach: Achievements
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

      this.loadStudy();
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
    this.currentcard = 1;
    this.studyFinished = true;
    this.setFontSize();
  }

  async nextCard() {
    console.log('next');
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
    if (this.currentcard === 1) return;
    console.log('prev');
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
    } else return;
  }

  async playAudio(ms) {
    await this.delay(ms);
    this.audioActive = true;
    await this.play();
    this.audioActive = false;
  }

  play() {
    return new Promise((res) => {
      if (this.Card.c_audio) {
        // this.audioCard.play();
        // this.audioCard.onended = res;
      } else
      if (this.Quiz.tts !== '' && this.platform.is('cordova')) {
        this.tts.speak({
          text: this.Card.c_text,
          locale: this.Quiz.tts,
          rate: this.Quiz.ttsSpeed / 100
        }).then(() => res())
        .catch(err => {
          this.toast.loadToast('Error playing audio. Check if TTS language correct.', 5);
        });
      } else {
        res();
      }
    });
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
