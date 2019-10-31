import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home/home.page';
import { SharedModule } from '../shared/shared.module';
import { QuizComponent } from './quiz/quiz.component';
import { StudyComponent } from './study/study.component';
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig, BrowserModule } from '@angular/platform-browser';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QuiztypeComponent } from './components/quiztype/quiztype.component';
import { QuizresultComponent } from './components/quizresult/quizresult.component';
import { QuizClass } from '../shared/classes/quiz';

export class ScrollWithSwipeConfig extends HammerGestureConfig {
  overrides = {
      pan: { direction: 6 },
      pinch: { enable: false },
      rotate: { enable: false }
  };
}

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: '', component: HomePage },
      { path: 'quiz/:type/:quizid/:rl', component: QuizComponent },
      { path: 'quiz/:type/:quizid', component: QuizComponent },
      { path: 'study/:quizid/:rl', component: StudyComponent },
      { path: 'study/:quizid', component: StudyComponent }
    ])
  ],
  declarations: [
    HomePage,
    QuizComponent,
    StudyComponent,
    QuiztypeComponent,
    QuizresultComponent
  ],
  entryComponents: [
    QuiztypeComponent
  ],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: ScrollWithSwipeConfig },
    TextToSpeech,
    QuizClass
  ]
})
export class TabhomeModule {}
