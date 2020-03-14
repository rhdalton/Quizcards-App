import { Injectable, OnInit } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { Card } from 'src/app/models/card';
import { Quiz } from 'src/app/models/quiz';
import { ExportCard } from 'src/app/models/exportcard';
import { ExportQuiz } from 'src/app/models/exportquiz';
import { ToastNotification } from './toast';
import { File } from '@ionic-native/File/ngx';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import * as uuid from 'uuid';
import { SqliteService } from 'src/app/services/sqlite.service';

@Injectable({
  providedIn: 'root'
})

export class QuizcardsExport implements OnInit {
  public _exportDir: string;

  constructor(
    private platform: Platform,
    private app: AppdataClass,
    private toast: ToastNotification,
    private file: File,
    private alert: AlertController,
    private sqlite: SqliteService
  ) {
    this._exportDir = this.file.externalRootDirectory + '/QuizCardsApp';
  }

  ngOnInit() {

  }

  quizToJson(quiz: Quiz, cards: Card[]) {
    const quizJson = {
      quizid: quiz.id,
      quizname: quiz.quizname,
      quizcolor: quiz.quizcolor,
      qcver: this.app.appv,
      qcdbver: this.app.latestdbv,
      backuptime: Math.floor(Date.now() / 1000),
      cards: []
    } as ExportQuiz;

    for (const c of cards) {
      const cardJson = {
        txt: c.c_text,
        subtxt: (c.c_subtext) ? c.c_subtext : undefined,
        ans: (c.c_correct === c.c_study) ? undefined : c.c_correct,
        study: c.c_study,
        substudy: (c.c_substudy) ? c.c_substudy : undefined,
        img: (c.c_image) ? c.c_image : undefined,
        imgp: (c.image_path) ? c.image_path : undefined,
        audio: (c.c_audio) ? c.c_audio : undefined,
        audiop: (c.audio_path) ? c.audio_path : undefined
      } as ExportCard;
      quizJson.cards.push(cardJson);
    }

    return JSON.stringify(quizJson);
  }

  exportQuizToDevice(quizJsonString, quizname = '') {

    const ext = '_' + (Math.floor(Date.now() / 1000)).toString() + '.qcs';

    // filename = filename.replace(/[^\w ]/gi, '');
    const filename = quizname.replace(/[\`\~\!\@\#\$\%\^\&\*\(\)\.\,\/\\\?\'\"\+\=\<\>\;\:\|\[\]\{\}]/g, '').replace(/\s+/g, '_') + '.qcs';
    // this.toast.loadToast('filename: ' + filename);
    // if (filename === '') filename = 'quizcards' + ext;
    // else if (filename.length > 30) filename = filename.substr(0, 30).replace(/\s+/g, '_') + ext;
    // else filename = filename.replace(/\s+/g, '_') + ext;

    return new Promise((res, rej) => {
      if (this.platform.is('android')) {
        this.file.checkDir(this.file.externalRootDirectory, 'QuizCardsApp')
          .then(() => {
            this.file.writeFile(this._exportDir, filename, quizJsonString, {replace: false})
              .then(() => {
                res(true);
              })
              .catch(async (err) => {
                if (err.message === 'PATH_EXISTS_ERR') {
                  if (await this.overWriteQuiz(quizname)) {
                    this.file.writeFile(this._exportDir, filename, quizJsonString, {replace: true})
                      .then(() => {
                        res(true);
                      });
                  } else {
                    this.toast.loadToast('Export canceled.');
                    res(false);
                  }
                } else {
                  this.toast.loadToast('ERR: ' + err.message);
                  res(false);
                }
              });
          })
          .catch(err => {
            this.file.createDir(this.file.externalRootDirectory, 'QuizCardsApp', false)
              .then(() => {
                this.file.writeFile(this._exportDir, filename, quizJsonString, {replace: true})
                  .then(() => {
                    res(true);
                  });
              });
          });
      }
    });
  }

  async overWriteQuiz(name) {
    return new Promise((res, rej) => {
      this.alert.create({
        header: 'Export File Exists',
        message: 'An Export file of a QuizCard set with the name "' + name + '" already exists. Do you want to overwrite this file?',
        buttons: [
          { text: 'NO', role: 'cancel', handler: () => res(false) },
          { text: 'YES', handler: () => res(true) }
        ]
      }).then(a => a.present());
    });
  }

  async overWriteQuizImport(name) {
    return new Promise((res, rej) => {
      this.alert.create({
        header: 'QuizCard Set Exists',
        message: 'A QuizCard set with the name "' + name + '" already exists. Do you want to continue the Import and overwrite the existing cards in this set?',
        buttons: [
          { text: 'NO', role: 'cancel', handler: () => res(false) },
          { text: 'YES', handler: () => res(true) }
        ]
      }).then(a => a.present());
    });
  }

  async importCardset(backup) {

    this.file.readAsText(this._exportDir, backup.quizfile)
      .then(async (data) => {
        const quizdata = JSON.parse(data);

        const existingQuiz: Quiz = await this.sqlite.getQuizByName(quizdata.quizname);
        if (existingQuiz.quizname) {
          if (await this.overWriteQuizImport(quizdata.quizname)) {
            await this.sqlite.updateQuizCardCount(existingQuiz, quizdata.cards.length);
            await this.sqlite.deleteQuizCards(existingQuiz.id);
            await this.importCards(existingQuiz.id, quizdata.cards);

            this.importSuccessAlert();
          } else {
            this.toast.loadToast('Import canceled.');
          }
        } else {

          const newQuizId = uuid.v1();
          quizdata.quizid = newQuizId;
          await this.importQuiz(quizdata);
          await this.importCards(newQuizId, quizdata.cards);

          this.importSuccessAlert();
        }
      })
      .catch(err => {
        this.alert.create({
          header: 'Import Failed',
          message: 'Unable to read backup file.',
          buttons: [
            { text: 'OK' }
          ]
        }).then(a => a.present());
      });
  }

  async importQuiz(quizdata: ExportQuiz, extras: any = {}) {

    const quiz: Quiz = {
      id: quizdata.quizid,
      quizname: quizdata.quizname,
      quizcolor: quizdata.quizcolor,
      switchtext: 0,
      cardcount: quizdata.cards.length,
      cardview: 'detail-view',
      isArchived: 0,
      isMergeable: 1,
      isBackable: 1,
      isShareable: 1,
      isPurchased: 0,
      cloudId: '',
      networkId: (extras.networkId) ? extras.networkId : '',
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

    await this.sqlite.addQuiz(quiz);
  }

  async importCards(quizId, importcards: ExportCard[]) {
    const cards: Card[] = [];

    for (let i = 0; i < importcards.length; i++) {
      const card: Card = {
        id: uuid.v1(),
        quiz_id: quizId,
        c_text: importcards[i].txt,
        c_subtext: (importcards[i].subtxt) ? importcards[i].subtxt : '',
        c_image: (importcards[i].img) ? importcards[i].img : '',
        image_path: (importcards[i].imgp) ? importcards[i].imgp : '',
        c_audio: (importcards[i].audio) ? importcards[i].audio : '',
        audio_path: (importcards[i].audiop) ? importcards[i].audiop : '',
        c_video: '',
        c_correct: (importcards[i].ans) ? importcards[i].ans : importcards[i].study,
        c_study: importcards[i].study,
        c_substudy: (importcards[i].substudy) ? importcards[i].substudy : '',
        cardorder: i,
        correct_count: 0,
        is_hidden: 0
      };
      cards.push(card);
    }
    await this.sqlite.addCards(cards);
  }

  importSuccessAlert() {
    this.alert.create({
      header: 'Import Success',
      message: 'This QuizCard set has been successfully imported from the backup file!',
      buttons: [
        { text: 'OK' }
      ]
    }).then(a => a.present());
  }
}
