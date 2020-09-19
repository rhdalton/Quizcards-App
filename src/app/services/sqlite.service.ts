import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { Platform, AlertController } from '@ionic/angular';
import { AppdataClass } from '../shared/classes/appdata';
import { ToastNotification } from '../shared/classes/toast';
import { AppSettings } from '../models/appsettings';
import { Quiz } from '../models/quiz';
import { WebstorageService } from './webstorage.service';
import { Card } from '../models/card';
import { ImageService } from './images.service';

@Injectable({
  providedIn: 'root'
})

export class SqliteService {
  db: SQLiteObject;
  dbversion: number;
  private _apps: AppSettings;

  constructor(
    private sqlite: SQLite,
    private webstorage: WebstorageService,
    private images: ImageService,
    private platform: Platform,
    private app: AppdataClass,
    private toast: ToastNotification,
    private alert: AlertController) {
      this.dbversion = this.app.latestdbv;

  }

  cdb() {
    return this.sqlite.create({
      name: 'quizcards.db',
      location: 'default'
    });
  }

  async createQuizCardsTables() {
    this._apps = await this.app.getAppSettings();
    if (this._apps.dbVersion === this.dbversion) return;

    this.db = await this.cdb();
    if (this.db) {

      // await this.db.executeSql("DROP TABLE IF EXISTS Quizzes", []);
      // await this.db.executeSql("DROP TABLE IF EXISTS Cards", []);

      const tableExist = await this.db.executeSql("SELECT * FROM sqlite_master WHERE type='table' AND name='Quizzes'", []);

      if (tableExist.rows.length === 0) {
        await this.db.executeSql(`CREATE TABLE Quizzes(
          id VARCHAR PRIMARY KEY,
          quizname VARCHAR,
          quizcolor VARCHAR,
          switchtext TINYINT,
          cardcount TINYINT,
          cardview VARCHAR,
          isArchived TINYINT,
          isMergeable TINYINT,
          isBackable TINYINT,
          isShareable TINYINT,
          isPurchased TINYINT,
          cloudId VARCHAR,
          networkId VARCHAR,
          shareId VARCHAR,
          creator_name VARCHAR,
          tts VARCHAR,
          ttsaudio TINYINT,
          quizLimit TINYINT,
          quizTimer TINYINT,
          studyShuffle TINYINT,
          quizShuffle TINYINT,
          ttsSpeed TINYINT)`, []);
        await this.db.executeSql('CREATE INDEX is_archived ON Quizzes(isArchived)', []);

        await this.db.executeSql(`CREATE TABLE Cards (
          id VARCHAR PRIMARY KEY,
          quiz_id VARCHAR,
          c_text TEXT,
          c_subtext TEXT,
          c_image VARCHAR,
          image_path VARCHAR,
          c_audio VARCHAR,
          audio_path VARCHAR,
          c_video VARCHAR,
          c_correct TEXT,
          c_study TEXT,
          c_substudy TEXT,
          cardorder TINYINT,
          correct_count SMALLINT,
          is_hidden TINYINT)`, []);
        await this.db.executeSql('CREATE INDEX quiz_id ON Cards(quiz_id)', []);
        await this.db.executeSql('CREATE INDEX cardorder ON Cards(cardorder)', []);
        await this.db.executeSql('CREATE INDEX correct_count ON Cards(correct_count)', []);

        this._apps.dbVersion = this.dbversion;
        this.toast.loadToast('QuizCards tables created: ' + this.dbversion);
      }

      // DB Patch 1.2
      // Add quizLimit to Quizzes, correctCount to Cards
      if (this._apps.dbVersion === 1.1) {
        await this.db.executeSql('ALTER TABLE Quizzes ADD COLUMN quizLimit TINYINT', []);
        await this.db.executeSql('ALTER TABLE Cards ADD COLUMN correct_count SMALLINT', []);
        await this.db.executeSql('CREATE INDEX correct_count ON Cards(correct_count)', []);

        await this.db.executeSql('UPDATE Cards SET correct_count = 0', []);
        this._apps.dbVersion = 1.2;
        this.toast.loadToast('DB updated: v' + this._apps.dbVersion);
      }

      // DB Patch 1.3
      // Add quizTimer, studyShuffle, quizShuffle on Quizzes table
      if (this._apps.dbVersion === 1.2) {
        await this.db.executeSql('ALTER TABLE Quizzes ADD COLUMN quizTimer TINYINT', []);
        await this.db.executeSql('ALTER TABLE Quizzes ADD COLUMN studyShuffle TINYINT', []);
        await this.db.executeSql('ALTER TABLE Quizzes ADD COLUMN quizShuffle TINYINT', []);
        await this.db.executeSql('ALTER TABLE Quizzes ADD COLUMN ttsSpeed TINYINT', []);
        this._apps.dbVersion = 1.3;
      }

      // DB Patch 1.4
      // Add is_hidden to Cards table
      if (this._apps.dbVersion === 1.3) {
        await this.db.executeSql('ALTER TABLE Cards ADD COLUMN is_hidden TINYINT DEFAULT 0', []);
        this._apps.dbVersion = 1.4;
      }

      this._apps.dbVersion = 1.4;

      await this.app.setAppSettings(this._apps);
    }
  }

  async getQuiz(quizId: string) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const result = await this.db.executeSql("SELECT * FROM Quizzes WHERE id=?", [quizId]);
        if (result.rows.length === 1) {
          return result.rows.item(0);
        }
        return {};
      }
    } else {
      // webstorage
      return await this.webstorage.getQuizById(quizId);
    }
  }

  async getQuizByName(quizName: string) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const result = await this.db.executeSql("SELECT * FROM Quizzes WHERE quizname=?", [quizName]);
        if (result.rows.length === 1) {
          return result.rows.item(0);
        }
        return {};
      }
    } else {
      // webstorage
      // return await this.webstorage.getQuizById(quizId);
    }
  }

  async addQuiz(quiz: Quiz) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const quizArray = [
          quiz.id,
          quiz.quizname.trim(),
          quiz.quizcolor,
          quiz.switchtext,
          quiz.cardcount,
          quiz.cardview,
          quiz.isArchived,
          quiz.isMergeable,
          quiz.isBackable,
          quiz.isShareable,
          quiz.isPurchased,
          quiz.cloudId,
          quiz.networkId,
          quiz.shareId,
          quiz.creator_name,
          quiz.tts,
          quiz.ttsaudio,
          quiz.quizLimit,
          quiz.quizTimer,
          quiz.studyShuffle,
          quiz.quizShuffle,
          quiz.ttsSpeed
        ];

        await this.db.executeSql(`INSERT INTO Quizzes (
          id,
          quizname,
          quizcolor,
          switchtext,
          cardcount,
          cardview,
          isArchived,
          isMergeable,
          isBackable,
          isShareable,
          isPurchased,
          cloudId,
          networkId,
          shareId,
          creator_name,
          tts,
          ttsaudio,
          quizLimit,
          quizTimer,
          studyShuffle,
          quizShuffle,
          ttsSpeed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, quizArray)
          .catch(e => {
            this.alert.create({
              message: e.message
            }).then(a => a.present());
          });
      }
    } else {
      // webstorage
      // get current quizlist
      let quizlist = await this.webstorage.getQuizlist();
      if (!quizlist) quizlist = [];
      quizlist.push(quiz);
      // update 'quizlist' array in db
      await this.webstorage.saveQuizList(quizlist);
      // save individual quiz
      await this.webstorage.saveQuizById(quiz);
    }
  }

  async updateQuiz(quiz: Quiz) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const quizArray = [
          quiz.quizname,
          quiz.quizcolor,
          quiz.switchtext,
          quiz.tts,
          quiz.ttsaudio,
          quiz.quizLimit,
          quiz.quizTimer,
          quiz.studyShuffle,
          quiz.quizShuffle,
          quiz.id
        ];

        await this.db.executeSql(`UPDATE Quizzes
                      SET quizname=?,
                          quizcolor=?,
                          switchtext=?,
                          tts=?,
                          ttsaudio=?,
                          quizLimit=?,
                          quizTimer=?,
                          studyShuffle=?,
                          quizShuffle=?
                          WHERE id=?`, quizArray);
      }
    } else {
      // webstorage
      // get current quizlist
      let quizlist = await this.webstorage.getQuizlist();
      if (!quizlist) quizlist = [];
      // loop through quizlist to find quiz to update
      for (let i = 0; i < quizlist.length; i++) {
        if (quizlist[i].id === quiz.id) {
          quizlist[i] = quiz;
          break;
        }
      }
      // save quizlist
      await this.webstorage.saveQuizList(quizlist);
      // save individual quiz
      await this.webstorage.saveQuizById(quiz);
    }
  }

  async updateQuizCardCount(quiz: Quiz, cardcount: number) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const quizArray = [
          cardcount,
          quiz.id
        ];

        await this.db.executeSql(`UPDATE Quizzes
                      SET cardcount=?
                          WHERE id=?`, quizArray);
      }
    } else {
      // webstorage
      // get current quizlist
      let quizlist = await this.webstorage.getQuizlist();
      if (!quizlist) quizlist = [];
      // loop through quizlist to find quiz to update
      for (let i = 0; i < quizlist.length; i++) {
        if (quizlist[i].id === quiz.id) {
          quizlist[i].cardcount = cardcount;
          break;
        }
      }
      // save quizlist
      await this.webstorage.saveQuizList(quizlist);
      // save individual quiz
      await this.webstorage.saveQuizById(quiz);
    }
  }

  async updateCloudQuiz(quiz: Quiz) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        await this.db.executeSql(`UPDATE Quizzes SET
          cardcount=?
          WHERE id=?`, [quiz.cardcount, quiz.id]);
        await this.db.executeSql('DELETE FROM Cards WHERE quiz_id=?', [quiz.id]);
      }
    } else {
      // webstorage
      await this.webstorage.updateCloudQuiz(quiz);
    }
  }

  async deleteQuiz(quizId) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const cards: Card[] = await this.getQuizCards(quizId);
        if (cards.length > 0) {
          for (let i = 0; i < cards.length; i++) {
            if (cards[i].c_image !== '') this.images.deleteImage(cards[i].image_path);
          }
          await this.db.executeSql('DELETE FROM Cards WHERE quiz_id=?', [quizId]);
        }
        await this.db.executeSql('DELETE FROM Quizzes WHERE id=?', [quizId]);
      }
    } else {
      // webstorage
      await this.webstorage.deleteQuiz(quizId);
    }
  }

  async setArchiveQuiz(quizId, archive) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        await this.db.executeSql('UPDATE Quizzes SET isArchived=? WHERE id=?', [archive, quizId]);
      }
    } else {
      // webstorage
      const quiz = await this.webstorage.getQuizById(quizId);
      quiz.isArchived = archive;
      await this.webstorage.saveQuizById(quiz);
      const quizlist = await this.webstorage.getQuizlist();
      for (let i = 0; i < quizlist.length; i++) {
        if (quizlist[i].id === quizId) {
          quizlist[i].isArchived = archive;
          await this.webstorage.saveQuizList(quizlist);
          break;
        }
      }
    }
  }

  async getQuizzes(archive: number = 0) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const items = [];
        const result = await this.db.executeSql("SELECT * FROM Quizzes WHERE isArchived=?", [archive]);
        if (result) {
          for (let i = 0; i < result.rows.length; i++) {
            items.push(result.rows.item(i));
          }
        }
        return items;
      }
    } else {
      // webstorage
      // get all quizzes
      const quizlist = await this.webstorage.getQuizlist();
      return quizlist.filter(obj => obj.isArchived === archive) || [];
    }
  }

  async getQuizCards(quizId: string, isQuiz = false) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const items = [];
        const sqlorder = (isQuiz) ? 'correct_count' : 'cardorder';
        const result = await this.db.executeSql(`SELECT * FROM Cards WHERE quiz_id=? ORDER BY ${sqlorder} ASC`, [quizId]);
        for (let i = 0; i < result.rows.length; i++) {
          items.push(result.rows.item(i));
        }
        return items;
      }
    } else {
      // webstorage
      return await this.webstorage.getQuizCards(quizId) || [];
    }
  }

  async addCards(cards: Card[], incr = false, orderId: number = null) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        let quiz: Quiz;
        let _orderId: number;
        if (incr) quiz = await this.getQuiz(cards[0].quiz_id);

        for (let i = 0; i < cards.length; i++) {

          if (orderId !== null) _orderId = orderId;
          else if (incr) _orderId = quiz.cardcount + 1 + i;
          else _orderId = cards[i].cardorder || i;

          const newCard = [
            cards[i].id,
            cards[i].quiz_id,
            cards[i].c_text.trim(),
            cards[i].c_subtext.trim(),
            cards[i].c_image,
            cards[i].image_path,
            cards[i].c_audio,
            cards[i].audio_path,
            cards[i].c_video,
            cards[i].c_correct.trim(),
            cards[i].c_study.trim(),
            cards[i].c_substudy.trim(),
            _orderId,
            cards[i].correct_count,
            cards[i].is_hidden
          ];

          if (orderId !== null) await this.db.executeSql('UPDATE Cards SET cardorder = cardorder + 1 WHERE quiz_id = ? AND cardorder >= ?', [cards[i].quiz_id, _orderId]);
          await this.db.executeSql('INSERT INTO Cards VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', newCard);
          if (incr) await this.db.executeSql('UPDATE Quizzes SET cardcount = cardcount+1 WHERE id =?', [cards[i].quiz_id]);
        }
      }
    } else {
      // webstorage
      if (incr) {
        const currentCards = await this.webstorage.getQuizCards(cards[0].quiz_id);
        if (orderId !== null) currentCards.splice(orderId, 0, cards[0]);
        else currentCards.push(cards[0]);
        await this.webstorage.saveQuizCards(currentCards, cards[0].quiz_id);
      } else {
        await this.webstorage.saveQuizCards(cards, cards[0].quiz_id);
      }
    }
  }

  async updateCard(card) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {

        const updateCard = [
          card.c_text.trim(),
          card.c_subtext.trim(),
          card.c_image,
          card.image_path,
          card.c_audio,
          card.audio_path,
          card.c_correct.trim(),
          card.c_study.trim(),
          card.c_substudy.trim(),
          card.id
        ];

        await this.db.executeSql(`UPDATE Cards SET
                                    c_text=?,
                                    c_subtext=?,
                                    c_image=?,
                                    image_path=?,
                                    c_audio=?,
                                    audio_path=?,
                                    c_correct=?,
                                    c_study=?,
                                    c_substudy=?
                                    WHERE id=?`, updateCard);
      }
    } else {
      // webstorage
      await this.webstorage.updateQuizCard(card);
    }
  }

  async hideCard(cardId, quizId, unhide = false) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const hide = (unhide) ? 0 : 1;
        await this.db.executeSql(`UPDATE Cards SET is_hidden = ? WHERE id=?`, [hide, cardId]);
      }
    } else {
      // webstorage
      await this.webstorage.hideQuizCard(cardId, quizId, unhide);
    }
  }

  async deleteCard(card: Card, cards: Card[], quizId: string) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        await this.db.executeSql('DELETE FROM Cards WHERE id=?', [card.id]);
        await this.db.executeSql('UPDATE Quizzes SET cardcount = cardcount-1 WHERE id=?', [quizId]);
        if (card.image_path && card.image_path !== '') this.images.deleteImage(card.image_path);
        await this.db.executeSql('UPDATE Cards SET cardorder=cardorder - 1 WHERE quiz_id=? AND cardorder > ?', [quizId, card.cardorder]);
      }
    } else {
      // webstorage
      await this.webstorage.deleteCard(card.id, cards, quizId);
    }
  }

  async deleteQuizCards(quizId) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        await this.db.executeSql('DELETE FROM Cards WHERE quiz_id=?', [quizId]);
      }
    }
  }

  async getQuizCard(cardId, quizId) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        const result = await this.db.executeSql('SELECT id, quiz_id, c_text, c_subtext, c_image, image_path, c_audio, audio_path, c_correct, c_substudy FROM Cards WHERE id=?', [cardId]);
        if (result.rows.length === 1) {
          return result.rows.item(0);
        }
      }
    } else {
      // webstorage
      const cards = await this.webstorage.getQuizCards(quizId);
      if (cards) {
        return cards.find(x => x.id === cardId);
      }
      return {};
    }
  }

  async sortCards(cards: Card[]) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        for (let i = 0; i < cards.length; i++) {
          await this.db.executeSql("UPDATE Cards SET cardorder=? WHERE id=?", [cards[i].cardorder, cards[i].id]);
        }
      }
    } else {
      // webstorage
      for (let i = 0; i < cards.length; i++) {
        cards[i].cardorder = i + 1;
      }
      await this.webstorage.saveQuizCards(cards, cards[0].quiz_id);
    }
  }

  async mergeCardSets(fromId, toId, fromCardCount, toCardCount) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        await this.db.executeSql('UPDATE Cards SET quiz_id=?, cardorder=cardorder+? WHERE quiz_id=?', [toId, toCardCount, fromId]);
        await this.db.executeSql('UPDATE Quizzes SET cardcount = cardcount+? WHERE id=?', [fromCardCount, toId]);
        await this.db.executeSql('DELETE FROM Quizzes WHERE id=?', [fromId]);
      }
    } else {
      // webstorage
      const cardsfrom: Card[] = await this.getQuizCards(fromId);
      for (let i = 0; i < cardsfrom.length; i++) {
        cardsfrom[i].cardorder = cardsfrom[i].cardorder + toCardCount;
        cardsfrom[i].quiz_id = toId;
      }
      let cardsto = await this.getQuizCards(toId);
      cardsto = cardsto.concat(cardsfrom);
      await this.webstorage.saveQuizCards(cardsto, toId);
      await this.webstorage.deleteQuiz(fromId);
    }
  }

  async updateCardView(quiz: Quiz) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        await this.db.executeSql('UPDATE Quizzes SET cardview=? WHERE id=?', [quiz.cardview, quiz.id]);
      }
    } else {
      // webstorage
      await this.webstorage.saveQuizById(quiz);
      await this.webstorage.saveQuizInQuizlist(quiz);
    }
  }

  async addCardCount(cardId, quizId, correct) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        if (correct) this.db.executeSql('UPDATE Cards SET correct_count = correct_count + 2 WHERE id=?', [cardId]);
        else this.db.executeSql('UPDATE Cards SET correct_count = correct_count + 1 WHERE id=?', [cardId]);
      }
    } else {
      // webstorage
      const add = (correct) ? 2 : 1;
      const cards: Card[] = await this.webstorage.getQuizCards(quizId);
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].id === cardId) {
          if (!cards[i].correct_count) cards[i].correct_count = 0;
          cards[i].correct_count = cards[i].correct_count + add;
          break;
        }
      }
      this.webstorage.saveQuizCards(cards, quizId);
    }
  }

  async updateQuizFirestoreId(quizId, fsId, type) {
    // is device
    if (this.platform.is('cordova')) {
      this.db = await this.cdb();
      if (this.db) {
        if (type === 'cloud') await this.db.executeSql('UPDATE Quizzes SET cloudId=? WHERE id=?', [fsId, quizId]);
        else if (type === 'share') await this.db.executeSql('UPDATE Quizzes SET shareId=? WHERE id=?', [fsId, quizId]);
        else if (type === 'network') await this.db.executeSql('UPDATE Quizzes SET networkId=? WHERE id=?', [fsId, quizId]);
      }
    } else {
      // webstorage
      await this.webstorage.updateQuizFirestoreId(quizId, fsId, type);
    }
  }
}
