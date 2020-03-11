import { Component, OnInit } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { AppSettings } from 'src/app/models/appsettings';
import { ActivatedRoute, Router } from '@angular/router';
import * as uuid from 'uuid';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { NavController } from '@ionic/angular';
import { Achievements } from 'src/app/shared/classes/achievements';

@Component({
  selector: 'app-quizform',
  templateUrl: './quizform.component.html',
  styleUrls: ['./quizform.component.scss'],
})
export class QuizformComponent {
  _apps: AppSettings;
  isPro: boolean;
  _moreoptions: boolean;
  quizId: string;
  Quiz: Quiz;
  ttsfield: any[];
  formFields: any;
  errorMsg: string;
  title: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private ach: Achievements
  ) {
    this.ttsfield = [
      { tts: '', text: 'Disable' },
      { tts: 'zh-CN', text: 'Chinese' },
      { tts: 'en-US', text: 'English/US' },
      { tts: 'en-GB', text: 'English/British' },
      { tts: 'fr_FR', text: 'French' },
      { tts: 'de_DE', text: 'German' },
      { tts: 'it_IT', text: 'Italian' },
      { tts: 'ja-JP', text: 'Japanese' },
      { tts: 'ko-KR', text: 'Korean' },
      { tts: 'pt-BR', text: 'Portuguese' },
      { tts: 'ru-RU', text: 'Russian' },
      { tts: 'es-ES', text: 'Spanish' }
    ];

    this._moreoptions = false;
    this.quizId = this.route.snapshot.params.quizid;
  }

  async ionViewWillEnter() {
    this._apps = await this.app.getAppSettings();
    this.isPro = this.app.isPro(this._apps.userStatus);
    if (this.quizId) {
      this.title = "Edit QuizCard Set";
      this.Quiz = await this.sqlite.getQuiz(this.quizId);
    } else {
      this.Quiz = {
        id: '',
        quizname: '',
        quizcolor: 'quiz-color-white',
        switchtext: 0,
        cardcount: 0,
        cardview: 'detail-view',
        isArchived: 0,
        isMergeable: 1,
        isBackable: 1,
        isShareable: 1,
        isPurchased: 0,
        cloudId: '',
        networkId: '',
        shareId: '',
        creator_name: '',
        tts: '',
        ttsaudio: 0,
        quizLimit: 30,
        quizTimer: 0,
        studyShuffle: 0,
        quizShuffle: 1,
        ttsSpeed: 80
      };
      this.title = "New QuizCard Set";
    }
    this.setFormFields();
  }

  setFormFields() {
    this.formFields = {
      switchtext: (this.Quiz.switchtext) ? true : false,
      studyorder: (this.Quiz.studyShuffle) ? true : false,
      quizorder: (this.Quiz.quizShuffle) ? true : false,
      ttsonly: (this.Quiz.ttsaudio) ? true : false
    };
  }

  setQuizValues() {
    this.Quiz.switchtext = (this.formFields.switchtext) ? 1 : 0;
    this.Quiz.studyShuffle = (this.formFields.studyorder) ? 1 : 0;
    this.Quiz.quizShuffle = (this.formFields.quizorder) ? 1 : 0;
    this.Quiz.ttsaudio = (this.formFields.ttsonly) ? 1 : 0;
  }

  async save(form) {

    if (this.Quiz.quizname.trim() === '') {
      this.errorMsg = 'Card set name required.';
      return;
    }

    this.setQuizValues();
    // new Quiz
    if (this.Quiz.id === "") {
      this.Quiz.id = uuid.v1();
      await this.sqlite.addQuiz(this.Quiz);

      this.ach.updateLocalAchievement(10, 1);
    } else {
      // update quiz
      await this.sqlite.updateQuiz(this.Quiz);
    }

    const curAch = await this.ach.getAchievements();
    const Quizzes = await this.sqlite.getQuizzes();
    console.log(curAch);

    if (Quizzes.length >= 7 && curAch[13].count === 0) {
      const clr = ['quiz-color-white', 'quiz-color-blue', 'quiz-color-red', 'quiz-color-green', 'quiz-color-yellow', 'quiz-color-purple', 'quiz-color-orange'];
      for (let i = 0; i < Quizzes.length; i++) {
        const index = clr.findIndex(x => x === Quizzes[i].quizcolor);
        if (index >= 0) clr.splice(index, 1);
        if (clr.length === 0) {
          this.ach.updateLocalAchievement(13, 1);
          break;
        }
      }
    }

    this.router.navigate(['/tabs/tabmanage/cards/', this.Quiz.id]);
  }

  toggleMoreoptions() {
    this._moreoptions = !this._moreoptions;
  }
}
