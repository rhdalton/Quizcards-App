import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { QuizformComponent } from './components/quizform/quizform.component';
import { RouterModule } from '@angular/router';
import { QuizcardsComponent } from './components/quizcards/quizcards.component';
import { CardformComponent } from './components/cardform/cardform.component';
import { Camera } from '@ionic-native/Camera/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { File } from '@ionic-native/File/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { CardpopoverComponent } from './components/cardpopover/cardpopover.component';
import { ImageService } from '../services/images.service';
import { CardsetpopoverComponent } from './components/cardsetpopover/cardsetpopover.component';
import { MergecardsetComponent } from './components/mergecardset/mergecardset.component';

@NgModule({
  declarations: [
    QuizformComponent,
    QuizcardsComponent,
    CardformComponent,
    CardpopoverComponent,
    CardsetpopoverComponent,
    MergecardsetComponent
  ],
  entryComponents: [
    CardpopoverComponent,
    CardsetpopoverComponent,
    MergecardsetComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: '', redirectTo: 'quiz', pathMatch: 'full' },
      { path: 'quiz/:quizid', component: QuizformComponent },
      { path: 'quiz', component: QuizformComponent },
      { path: 'cards/:quizid', component: QuizcardsComponent },
      { path: 'card/:quizid/:cardid/:addbefore', component: CardformComponent },
      { path: 'card/:quizid/:cardid', component: CardformComponent },
      { path: 'card/:quizid', component: CardformComponent }
    ])
  ],
  providers: [
  ]
})
export class TabmanagePageModule { }
