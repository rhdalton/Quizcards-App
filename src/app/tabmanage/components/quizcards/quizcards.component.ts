import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Quiz } from 'src/app/models/quiz';
import { ActivatedRoute, Router } from '@angular/router';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { SqliteService } from 'src/app/services/sqlite.service';
import { AppSettings } from 'src/app/models/appsettings';
import { Card } from 'src/app/models/card';
import { AlertController, PopoverController, LoadingController, ModalController, NavController, Events } from '@ionic/angular';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { CardformComponent } from '../cardform/cardform.component';
import { CardpopoverComponent } from '../cardpopover/cardpopover.component';
import { CardsetpopoverComponent } from '../cardsetpopover/cardsetpopover.component';
import { MergecardsetComponent } from '../mergecardset/mergecardset.component';
import { NetworkService } from 'src/app/services/network.service';
import { File } from '@ionic-native/File/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';

@Component({
  selector: 'app-quizcards',
  templateUrl: './quizcards.component.html',
  styleUrls: ['./quizcards.component.scss'],
})
export class QuizcardsComponent implements OnInit {
  _quizId: string;
  _cardsloaded: boolean;
  _limits: any;
  _apps: AppSettings;
  _isPro: boolean;
  _color: string;
  _showSearch: boolean;
  Quiz: Quiz;
  allCards: Card[];
  filteredCards: Card[];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sqlite: SqliteService,
    private app: AppdataClass,
    private alert: AlertController,
    private toast: ToastNotification,
    private pop: PopoverController,
    private loader: LoadingController,
    private modal: ModalController,
    private network: NetworkService,
    private file: File,
    private keyboard: Keyboard,
    private exportquiz: QuizcardsExport
  ) {
    this._quizId = this.route.snapshot.params.quizid;
    this._cardsloaded = false;
  }

  async ngOnInit() {

  }

  async ionViewWillEnter() {
    if (this._quizId) {
      this._apps = await this.app.getAppSettings();
      this.Quiz = await this.sqlite.getQuiz(this._quizId);
      this._limits = this.app.appLimits(this._apps.userStatus);
      this._isPro = this.app.isPro(this._apps.userStatus);
      this._showSearch = false;

      if (this.Quiz) {
        this.getCards();
      }
    }
  }

  async getCards() {
    this.allCards = await this.sqlite.getQuizCards(this._quizId);
    this.filteredCards = this.allCards;
    this.Quiz.cardcount = this.allCards.length;
    this._cardsloaded = true;
  }

  addCard(pos: number = null) {
    if (this.allCards.length >= this._limits.cardLimit) {
      let msg = 'You have reached the Personal limit of ' + this._limits.cardLimit + ' cards. Please upgrade to a Pro account to increase the card limit.';
      if (this._isPro) msg = 'Card sets have a limit of ' + this._limits.cardLimit + ' cards to ensure best app performance. Please create a new set.';
      this.alert.create({
        header: 'Max Card Limit',
        message: msg,
        buttons: ['OK']
      }).then(a => a.present());
      return;
    } else if (pos !== null) {
      this.router.navigate(['/tabs/tabmanage/card/', this._quizId, '0', pos]);
    } else {
      this.router.navigate(['/tabs/tabmanage/card/', this._quizId]);
    }
  }

  showSearch() {
    this._showSearch = !this._showSearch;
    if (!this._showSearch) {
      this.filteredCards = this.allCards;
    }
  }

  filterCards(term) {
    this.keyboard.hide();
    term = term.toLowerCase();
    this.filteredCards = this.allCards.filter((card) => {
      return card.c_text.toLowerCase().includes(term) || card.c_study.toLowerCase().includes(term);
    });
  }

  async cardOptions(ev: any, cardId, orderId, isHidden) {
    const popover = await this.pop.create({
      component: CardpopoverComponent,
      event: ev,
      translucent: false,
      componentProps: {
        popover: this.pop,
        quizId: this._quizId,
        cardId: cardId,
        isHidden: isHidden,
        deleteCard: () => this.deleteCardAlert(cardId),
        addBefore: () => { this.pop.dismiss(); this.addCard(orderId); },
        hideCard: () => { this.pop.dismiss(); this.hideCard(cardId); },
        unhideCard: () => { this.pop.dismiss(); this.unhideCard(cardId); }
      },
      cssClass: 'standard-popover'
    });
    return await popover.present();
  }

  cardSetOptions(ev) {
    this.pop.create({
      component: CardsetpopoverComponent,
      event: ev,
      translucent: true,
      componentProps: {
        popover: this.pop,
        quizid: this._quizId,
        isBackable: this.Quiz.isBackable,
        isMergeable: this.Quiz.isMergeable,
        isShareable: this.Quiz.isShareable,
        mergeModal: () => this.mergeCardsetModal(),
        backupToCloud: () => this.backupToCloud(),
        sortCards: () => this.sortCards(),
        exportToDevice: () => this.exportToDevice()
      },
      cssClass: 'standard-popover'
    }).then(p => p.present());
  }

  async hideCard(cardId) {
    await this.sqlite.hideCard(cardId, this._quizId);
    for (let i = 0; i < this.filteredCards.length; i++) {
      if (this.filteredCards[i].id === cardId) {
        this.filteredCards[i].is_hidden = 1;
        break;
      }
    }
    this.toast.loadToast('Card has been hidden.');
  }

  async unhideCard(cardId) {
    await this.sqlite.hideCard(cardId, this._quizId, true);
    for (let i = 0; i < this.filteredCards.length; i++) {
      if (this.filteredCards[i].id === cardId) {
        this.filteredCards[i].is_hidden = 0;
        break;
      }
    }
    this.toast.loadToast('Card has been un-hidden.');
  }

  deleteCardAlert(cardId) {
    this.alert.create({
      header: 'Delete Card',
      message: 'Are you sure you want to delete this Card? This action cannot be un-done.',
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => {} },
        { text: 'Yes', handler: () => this.deleteCard(cardId) }
      ]
    }).then(a => a.present());
  }

  async deleteCard(cardId) {
    this.allCards = await this.sqlite.deleteCard(cardId, this.allCards, this._quizId);
    this.filteredCards = this.allCards;
    this.Quiz.cardcount = this.allCards.length;
    this.toast.loadToast('Card has been deleted.');
  }

  async mergeCardsetModal() {
    this.pop.dismiss();
    this.modal.create({
      component: MergecardsetComponent,
      componentProps: {
        modal: this.modal,
        userStatus: this._apps.userStatus,
        limits: this._limits,
        quizId: this._quizId,
        cardcount: this.Quiz.cardcount
      }
    }).then(m => m.present());
  }

  async alertMedia() {
    return new Promise(async (res) => {
      const a = await this.alert.create({
        header: 'Image/Audio Cards',
        message: 'Images & Audio clips cannot be exported to file. However, the cards will save the locations of image/audio on local device. ' +
        'If the media remains on your device, you will be able to import this card set and still use the media in your set.',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => res(false) },
          { text: 'Continue Export', handler: () => res(true) }
        ],
        backdropDismiss: false
      });
      await a.present();
    });
  }

  async exportToDevice() {
    this.pop.dismiss();

    if (this.allCards.length === 0) {
      this.alert.create({
        header: 'Export to Device',
        message: 'At least one card is required to export a QuizCards set.',
        buttons: [
          { text: 'Dismiss', role: 'cancel' }
        ]
      }).then(a => a.present());
      return;
    }

    for (let i = 0; i < this.allCards.length; i++) {
      if (this.allCards[i].c_image !== '' || this.allCards[i].c_audio !== '') {
        if (!await this.alertMedia()) return;
        break;
      }
    }

    this.alert.create({
      header: 'Export to Device',
      message: 'This will export your QuizCards set to a file in the directory "/QuizCardsApp". You\'ll be able to keep this file to import this set at any time.',
      buttons: [
        { text: 'Cancel', role: 'cancel', handler: () => {} },
        { text: 'OK', handler: () => this.doExport() }
      ]
    }).then(a => a.present());
  }

  async doExport() {
    // console.log('export: ', this.File.externalApplicationStorageDirectory);
    const quizJson = this.exportquiz.quizToJson(this.Quiz, this.allCards);
    if (await this.exportquiz.exportQuizToDevice(quizJson, this.Quiz.quizname)) {
      this.alert.create({
        header: 'Export Success',
        message: 'This card set has successfully been exported to your device\'s "/QuizCardsApp" directory. You can import it by going to the "MORE" tab.',
        buttons: [
          { text: 'OK' }
        ]
      }).then(a => a.present());
    }
  }

  async backupToCloud() {
    this.pop.dismiss();
    if (!this.network.isOnline()) {
      this.network.alertOffline('back-up to the cloud');
      return;
    }
    if (this.allCards.length === 0) {
      this.alert.create({
        message: 'At least one card is required to back-up a Card Set to the cloud.',
        buttons: ['OK']
      }).then(a => a.present());
      return;
    }
    this.router.navigate(['/tabs/tabaccount/usercloud', this._quizId]);
  }

  async sortCards() {
    const loader = await this.loader.create({ message: 'Re-ordering cards...'});
    loader.present();
    this.allCards.sort(this.sortCompareCards);
    await this.sqlite.sortCards(this.allCards);
    loader.dismiss();
    this.toast.loadToast('Card re-ordering complete!');
  }

  sortCompareCards(a, b) {
    if (a.c_text < b.c_text) return -1;
    else if (a.c_text > b.c_text) return 1;
    return 0;
  }

  async switchView() {
    let msg = 'Card view error occurred.';
    if (this.Quiz.cardview === 'compact-view') {
      this.Quiz.cardview = 'detail-view';
      msg = 'Changed to detailed view.';
    } else {
      this.Quiz.cardview = 'compact-view';
      msg = 'Changed to compact view.';
    }
    await this.sqlite.updateCardView(this.Quiz);
    this.toast.loadToast(msg);
  }
}
