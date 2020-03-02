import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HomePage } from './home/home.page';
import { SharedModule } from '../shared/shared.module';
import { QuizComponent } from './quiz/quiz.component';
import { StudyComponent } from './study/study.component';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { QuiztypeComponent } from './components/quiztype/quiztype.component';
import { QuizresultComponent } from './components/quizresult/quizresult.component';
import { QuizClass } from '../shared/classes/quiz';
import { Keyboard } from '@ionic-native/keyboard/ngx';

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
    TextToSpeech,
    QuizClass,
    Keyboard
  ]
})
export class TabhomeModule {}
