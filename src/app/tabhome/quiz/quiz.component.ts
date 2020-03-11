import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AppSettings } from 'src/app/models/appsettings';
import { Quiz } from 'src/app/models/quiz';
import { Card } from 'src/app/models/card';
import { trigger, transition, animate, style } from '@angular/animations';
import { DOCUMENT } from '@angular/common';
import { QuiztypeComponent } from '../components/quiztype/quiztype.component';
import { PopoverController, Platform, AlertController } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { QuizClass } from 'src/app/shared/classes/quiz';
import { Achievements } from 'src/app/shared/classes/achievements';
import { PlayAudio } from 'src/app/shared/classes/playaudio';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styles: [`
  .timercircle .spinner {animation: rota {{Quiz.quizTimer}}s linear;}
  .timercircle .filler {animation: opa {{Quiz.quizTimer}}s steps(1, end) reverse;}
  .timercircle .mask {animation: opa {{Quiz.quizTimer}}s steps(1, end);}
  `],
  animations: [
    trigger('animateCard', [
      transition(':increment', animate('200ms', style({ transform: 'translateX(-110%)' }))),
      transition(':decrement', animate('200ms', style({ transform: 'translateX(110%)' })))
    ])
  ]
})
export class QuizComponent implements OnInit {
  _app: AppSettings;
  quizId: string;
  quizType: string;
  _cardCountSwipe = 0;
  isPro = false;
  Quiz: Quiz;
  totalcards: number;
  currentcard = 1;
  Cards: Card[];
  allCards: Card[];
  Card: Card;
  multiAnswerList = [];
  multiAnswerCorrect: number;
  typeinAnswer = '';
  typeinCssResult = '';
  quizResults = [];
  showResults = false;
  correct_audio;
  incorrect_audio;
  audioActive = false;
  madeChoice = false;
  totalCorrect = 0;
  percentCorrect = 0;
  cardsAnswered = 0;
  fontsize = '';
  qcardsize = '';
  dasharray: string;
  strokecolor: string;
  timer: number;
  dashoffset: number;
  dashtransition: string;
  interval;
  reload: string;
  quizFinished = false;

  constructor(
    private route: ActivatedRoute,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private render: Renderer2,
    private platform: Platform,
    private quizClass: QuizClass,
    private ach: Achievements,
    private audio: PlayAudio,
    private router: Router,
    private alert: AlertController
  ) {
    this.quizId = this.route.snapshot.params.quizid;
    this.quizType = this.route.snapshot.params.type;
    this.reload = this.route.snapshot.params.rl || '';
  }

  async ngOnInit() {
  }

  ionViewWillLeave() {
    console.log('clear interval');
    clearInterval(this.interval);

    this.ach.updateLocalAchievement(5, this.cardsAnswered);
  }

  async ionViewWillEnter() {
    this._app = await this.app.getAppSettings();
    if (this._app.quizAudio) {
      this.correct_audio = new Audio();
      this.incorrect_audio = new Audio();
      this.loadQuizSounds();
    }

    this.isPro = this.app.isPro(this._app.userStatus);

    this.Quiz = await this.sqlite.getQuiz(this.quizId);
    if (this.Quiz) {

      this.qcardsize = this.quizClass.setQcardSize(this.Quiz.switchtext);
      this.loadQuiz();
    }
  }

  async loadQuiz() {
    this.currentcard = 1;
    this.quizResults = [];
    this.showResults = false;
    this.quizFinished = false;
    this.totalCorrect = 0;

    this.setStrokeColor();

    this.allCards = await this.sqlite.getQuizCards(this.quizId, true);
    // remove hidden cards from set
    this.allCards = this.allCards.filter((card) => {
      return card.is_hidden !== 1;
    });

    if (this.allCards.length === 0) {
      this.alert.create({
        header: 'No Quiz Cards',
        message: 'No cards avaliable to quiz. Check to make sure all cards are not "hidden".',
        buttons: [
          { text: 'OK' }
        ]
      }).then(a => a.present());
      this.router.navigate(['/tabs/tabhome']);
      return;
    }

    if (this.Quiz.quizLimit < this.allCards.length) this.Cards = this.allCards.slice(0, this.Quiz.quizLimit);
    else this.Cards = this.allCards;

    this.totalcards = this.Cards.length;

    if (this.Quiz.quizShuffle) this.Cards = this.randomSortArray(this.Cards);

    this.Card = this.Cards[0];

    this.setFontSize();

    if (this.quizType === 'multi') this.randomSortAnswers();
    this.startTimer();
  }

  randomSortAnswers() {
    this.multiAnswerList = [];
    let answerChoices = [];
    const answerList = [];
    const allChoices = this.randomSortArray(this.allCards);

    if (this.Quiz.switchtext === 1) answerChoices.push([0, this.Card.c_text]);
    else answerChoices.push([0, this.Card.c_correct]);
    answerList.push(answerChoices[0][1]);

    // loop through 3 times to add random wrong answers to answerChoices
    let x = 1;
    while (x <= 3) {
      const take = allChoices.pop();
      if (!take) {
        answerChoices.push([x, '']);
        x++;
        continue;
      }
      const ans = (this.Quiz.switchtext === 1) ? take.c_text : take.c_correct;
      if (answerList.includes(ans)) continue;
      if (this.Quiz.switchtext === 1) answerChoices.push([x, take.c_text]);
      else answerChoices.push([x, take.c_correct]);
      answerList.push(ans);
      x++;
    }

    answerChoices = this.randomSortArray(answerChoices);

    for (let i = 0; i < answerChoices.length; i++) {
      this.multiAnswerList.push(answerChoices[i][1]);
      if (answerChoices[i][0] === 0) this.multiAnswerCorrect = i;
    }
  }

  async chooseAnswer(choice, event) {
    if (this.madeChoice) return;
    this.madeChoice = true;

    this.audio.endAudio();

    clearInterval(this.interval);

    if (choice === null) {
      if (this._app.quizAudio) this.playIncorrectAudio();
      this.addToQuizResult(false, "[Timer ran out]");
      this.sqlite.addCardCount(this.Card.id, this.Quiz.id, false);

    } else if (choice === this.multiAnswerCorrect) {
      this.totalCorrect++;
      document.getElementById('multi-' + choice).classList.add('correct-answer');
      // this.render.addClass(event.target, 'correct-answer');
      if (this._app.quizAudio) this.playCorrectAudio();
      this.addToQuizResult(true, this.multiAnswerList[choice]);

      this.sqlite.addCardCount(this.Card.id, this.Quiz.id, true);
    } else {
      document.getElementById('multi-' + choice).classList.add('incorrect-answer');
      // this.render.addClass(event.target, 'incorrect-answer');
      if (this._app.quizAudio) this.playIncorrectAudio();
      this.addToQuizResult(false, this.multiAnswerList[choice]);

      this.sqlite.addCardCount(this.Card.id, this.Quiz.id, false);
    }

    await this.delay(800);
    if (event !== null) {
      document.getElementById('multi-' + choice).classList.remove('correct-answer');
      document.getElementById('multi-' + choice).classList.remove('incorrect-answer');
      // this.render.removeClass(event.target, 'correct-answer');
      // this.render.removeClass(event.target, 'incorrect-answer');
    }
    this.nextCard();
  }

  async checkAnswer(answer) {

    if (answer !== null && answer.typeinAnswer.trim() === '') return;

    this.audio.endAudio();
    clearInterval(this.interval);

    if (answer === null) {
      if (this._app.quizAudio) this.playIncorrectAudio();
      this.addToQuizResult(false, "[Timer ran out]");
      this.sqlite.addCardCount(this.Card.id, this.Quiz.id, false);
    } else {

      const correct = (this.Quiz.switchtext === 1) ? this.Card.c_text : this.Card.c_correct;
      if (answer.typeinAnswer.toLowerCase().trim() === correct.toLowerCase()) {
        this.totalCorrect++;
        this.typeinCssResult = 'correct-answer';
        if (this._app.quizAudio) this.playCorrectAudio();
        this.addToQuizResult(true, answer.typeinAnswer);
        this.sqlite.addCardCount(this.Card.id, this.Quiz.id, true);

      } else {
        this.typeinCssResult = 'incorrect-answer';
        if (this._app.quizAudio) this.playIncorrectAudio();
        this.addToQuizResult(false, answer.typeinAnswer);
        this.sqlite.addCardCount(this.Card.id, this.Quiz.id, false);
      }
    }
    await this.delay(800);
    this.typeinCssResult = '';
    this.typeinAnswer = '';
    this.nextCard();
  }

  async nextCard() {
    if (this._app.rtl) this._cardCountSwipe--;
    else this._cardCountSwipe++;

    await this.delay(200);
    this.madeChoice = false;
    this.cardsAnswered++;

    if (this.Cards[this.currentcard]) {
      this.Card = this.Cards[this.currentcard];
      this.setFontSize();
      this.currentcard++;
      if (this.quizType === 'multi') this.randomSortAnswers();
      this.startTimer();

    } else {
      this.Card = null;
      this.quizFinished = true;

      const userAch = await this.ach.getAchievements();

      if (this.quizType === 'multi' && this.totalcards >= 10) {
        const achId = userAch.findIndex(x => x.id === 8);
        this.ach.updateLocalAchievement(6, 1);
        if (userAch[achId].count < 1 && this.totalCorrect === this.totalcards && this.totalcards >= 10) await this.ach.updateLocalAchievement(8, 1);
        if (userAch[achId].count < 2 && this.totalCorrect === this.totalcards && this.totalcards >= 25) await this.ach.updateLocalAchievement(8, 2);
        if (userAch[achId].count < 3 && this.totalCorrect === this.totalcards && this.totalcards >= 40) await this.ach.updateLocalAchievement(8, 3);

      } else if (this.quizType === 'typein' && this.totalcards >= 10) {
        const achId = userAch.findIndex(x => x.id === 9);
        this.ach.updateLocalAchievement(7, 1);
        if (userAch[achId].count < 1 && this.totalCorrect === this.totalcards && this.totalcards >= 10) await this.ach.updateLocalAchievement(9, 1);
        if (userAch[achId].count < 1 && this.totalCorrect === this.totalcards && this.totalcards >= 25) await this.ach.updateLocalAchievement(9, 2);
        if (userAch[achId].count < 1 && this.totalCorrect === this.totalcards && this.totalcards >= 40) await this.ach.updateLocalAchievement(9, 3);

      }
    }
  }

  startTimer() {
    if (this.isPro && this.Quiz.quizTimer > 0) {
      this.dashtransition = '';
      this.dashoffset = 0;
      this.timerCountdown();
    }
  }

  timerCountdown() {
    this.timer = this.Quiz.quizTimer;

    this.interval = setInterval(() => {
      this.timer--;
      // console.log(this.timer);
      if (this.timer > 0) {
        this.dashtransition = 'all 1s linear';
        this.dashoffset = 82 - ((this.timer - 1) * (82 / this.Quiz.quizTimer));
      }
      if (this.timer === 0) {
        if (this.interval) {
          if (this.quizType === 'multi') this.chooseAnswer(null, null);
          else if (this.quizType === 'typein') this.checkAnswer(null);
        }
        return;
      }
    }, 1000);
  }

  addToQuizResult(correct: boolean, userAnswer) {
    this.quizResults.push({
      c_image: this.Card.c_image,
      c_text: (this.Quiz.switchtext === 1) ? this.Card.c_correct : this.Card.c_text,
      isCorrect: correct,
      correctAnswer: (this.Quiz.switchtext === 1) ? this.Card.c_text : this.Card.c_correct,
      userAnswer: userAnswer
    });
  }

  setFontSize() {
    this.fontsize = (this.Quiz.switchtext === 1) ?
      this.quizClass.setFontSize(this.Card.c_correct, this.Card.c_image) :
      this.quizClass.setFontSize(this.Card.c_text, this.Card.c_image);
  }

  focusInput(event) {
    let total = 0;
    let container = null;
    const _rec = (obj) => {
        total += obj.offsetTop;
        const par = obj.offsetParent;
        if (par && par.localName !== 'ion-content') {
            _rec(par);
        } else {
            container = par;
        }
    };
    _rec(event.target);
    container.scrollToPoint(0, total - 50, 400);
  }

  loadQuizSounds() {
    this.correct_audio.src = '../assets/sounds/correct.mp3';
    this.correct_audio.load();
    this.incorrect_audio.src = '../assets/sounds/incorrect.mp3';
    this.incorrect_audio.load();
  }

  playCorrectAudio() {
    this.correct_audio.play();
  }
  playIncorrectAudio() {
    this.incorrect_audio.play();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  randomSortArray(array) {
    return array.concat().sort(() => 0.5 - Math.random());
  }

  setStrokeColor() {
    switch (this.Quiz.quizcolor) {
      case 'quiz-color-white':
        this.strokecolor = '#9f9f9f';
        break;
      case 'quiz-color-blue':
        this.strokecolor = '#479be2';
        break;
      case 'quiz-color-red':
        this.strokecolor = '#f27272';
        break;
      case 'quiz-color-green':
        this.strokecolor = '#47ca57';
        break;
      case 'quiz-color-yellow':
        this.strokecolor = '#d2c212';
        break;
      case 'quiz-color-purple':
        this.strokecolor = '#c46fff';
        break;
      case 'quiz-color-orange':
        this.strokecolor = '#ffb15d';
        break;
    }
  }
}
