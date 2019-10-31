import { Component, OnInit } from '@angular/core';
import { SqliteService } from 'src/app/services/sqlite.service';
import { Quiz } from 'src/app/models/quiz';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-restore',
  templateUrl: './restore.component.html',
  styleUrls: ['./restore.component.scss'],
})
export class RestoreComponent implements OnInit {
  Quizzes: Quiz[];

  constructor(
    private sqlite: SqliteService,
    private alert: AlertController,
    private router: Router
  ) { }

  ngOnInit() {}

  async ionViewWillEnter() {
    this.Quizzes = await this.sqlite.getQuizzes(1);
  }

  async restore(quizId) {
    await this.sqlite.setArchiveQuiz(quizId, 0);
    this.alert.create({ header: 'Success', message: 'This QuizCard Set has been restored!', buttons: ['OK'] })
      .then(a => {
        a.present();
        this.router.navigate(['/tabs/tabhome']);
      });
  }
}
