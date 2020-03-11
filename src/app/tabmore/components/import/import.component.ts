import { Component, OnInit } from '@angular/core';
import { File } from '@ionic-native/File/ngx';
import { AlertController, Platform } from '@ionic/angular';
import { Quiz } from 'src/app/models/quiz';
import { Card } from 'src/app/models/card';
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';

@Component({
  selector: 'quizcards-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
})
export class ImportComponent implements OnInit {
  _isLoaded = false;
  backups = [];

  constructor(
    private file: File,
    private platform: Platform,
    private alert: AlertController,
    private importquiz: QuizcardsExport
  ) { }

  ngOnInit() {
    this.loadBackups();
  }

  async loadBackups() {
    if (this.platform.is('cordova')) {
      this.file.checkDir(this.file.externalRootDirectory, 'QuizCardsApp')
        .then(async () => {
          const files = await this.file.listDir(this.file.externalRootDirectory, 'QuizCardsApp');
          files.forEach(async (f) => {
            const extn = f.fullPath.split(".").pop();
            if (f.isFile && extn === 'qcs') {
              const data = await this.file.readAsText(this.importquiz._exportDir, f.name);
              const quizdata = JSON.parse(data);
              if (quizdata.quizname && quizdata.cards.length > 0) {
                this.backups.push({ quizname: quizdata.quizname, quizcolor: quizdata.quizcolor, cardcount: quizdata.cards.length, quizfile: f.name });
              }
            }
          });
          this._isLoaded = true;
        })
        .catch(() => {
          this._isLoaded = true;
        });
    } else {
      this._isLoaded = true;
    }
  }

  importCardset(backup) {
    this.importquiz.importCardset(backup);
  }
}
