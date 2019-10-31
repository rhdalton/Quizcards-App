import { Component, OnInit } from '@angular/core';
import { NavParams, LoadingController } from '@ionic/angular';
import { Quiz } from 'src/app/models/quiz';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { User } from 'src/app/models/user';
import { Networkcategories } from 'src/app/shared/classes/networkcategories';
import { firestore } from 'firebase/app';
import { FirestoreService } from 'src/app/services/firestore.service';
import { SqliteService } from 'src/app/services/sqlite.service';
import { Card } from 'src/app/models/card';
import { NWCard } from 'src/app/models/nwcard';

@Component({
  selector: 'app-com-uploadmodal',
  templateUrl: './com-uploadmodal.component.html',
  styleUrls: ['./com-uploadmodal.component.scss'],
})
export class ComUploadmodalComponent implements OnInit {
  _loader;
  modal;
  Quiz: Quiz;
  NWQuiz: NWQuiz;
  User: User;
  categoryList;
  lang_subcat;
  subj_subcat;
  oth_subcat;
  current_cat;
  current_subcat;
  subcat;
  quizdesc;
  alertMessage = '';

  constructor(
    private firestoreService: FirestoreService,
    private sqlite: SqliteService,
    private cats: Networkcategories,
    private params: NavParams,
    private load: LoadingController
  ) {
    this.modal = this.params.get('modal');
    this.Quiz = this.params.get('quiz');
    this.NWQuiz = this.params.get('nwquiz');
    this.User = this.params.get('user');
    this.categoryList = this.cats.getCategoryList;
    this.lang_subcat = this.cats.getLang_subcat;
    this.subj_subcat = this.cats.getSubj_subcat;
    this.oth_subcat = this.cats.getOth_subcat;
    this.subcat = [];
  }

  ngOnInit() {
    // console.log(this.Quiz);
    if (this.Quiz.networkId) {
      this.current_cat = this.NWQuiz.quizcategory;
      this.changeCat();
      this.current_subcat = this.NWQuiz.quizsubcat;
      this.quizdesc = this.NWQuiz.quizdesc;
    } else {
      this.current_cat = '';
    }
  }

  async uploadQuiz(form) {
    if (!form.current_cat || form.current_cat === '' ||
      !form.current_subcat || form.current_subcat === '' ||
      !form.quizdesc || form.quizdesc.trim() === '') {
        this.alertMessage = 'Category selection and short description are required.';
        return;
    }

    this._loader = await this.load.create({ message: 'Uploading card set...' });
    this._loader.present();

    if (this.Quiz.networkId && this.Quiz.networkId !== '') {

      const updateQuiz: NWQuiz = {
        ...this.NWQuiz,
        quizname: this.Quiz.quizname,
        quizcolor: this.Quiz.quizcolor,
        quizdesc: form.quizdesc,
        cardcount: this.Quiz.cardcount,
        quizcategory: form.current_cat,
        quizsubcat: form.current_subcat,
        quizsubcatkey: form.current_cat.substr(0, 3).toLowerCase() + '-' + form.current_subcat.toLowerCase(),
        quiztts: (this.Quiz.tts) ? this.Quiz.tts : '',
        quizpublishdate: firestore.Timestamp.now().toDate(),
        quizdownloads: 0,
        quizrating: 0
      };

      await this.firestoreService.updateCloudCardSet(updateQuiz, 'network_quizzes');

      this.addNetworkCards(this.Quiz.networkId);

    // ELSE upload NEW Quiz
    } else {

      const newQuiz: NWQuiz = {
        id: this.Quiz.id,
        networkId: '',
        quizname: this.Quiz.quizname,
        quizcolor: this.Quiz.quizcolor,
        quizdesc: form.quizdesc,
        quizcategory: form.current_cat,
        quizsubcat: form.current_subcat,
        quizsubcatkey: form.current_cat.substr(0, 3).toLowerCase() + '-' + form.current_subcat.toLowerCase(),
        quiztts: this.Quiz.tts,
        quizauthor: this.User.displayName,
        quizpublishdate: firestore.Timestamp.now().toDate(),
        audioquiz: false,
        imagequiz: false,
        quizdownloads: 0,
        quizrating: 0,
        cardcount: this.Quiz.cardcount,
        isPurchase: false,
        purchasePrice: 0,
        productId: '',
        isActive: true
      };

      const result = await this.firestoreService.saveCloudCardSet(newQuiz, 'network_quizzes');
      await this.sqlite.updateQuizFirestoreId(this.Quiz.id, result.id, 'network');

      await this.addNetworkCards(result.id);
    }
    this.modal.dismiss();
    this._loader.dismiss();
  }

  async addNetworkCards(networkId) {

    const quizCards: Card[] = await this.sqlite.getQuizCards(this.Quiz.id);
    const newCards = [];

    for (let i = 0; i < quizCards.length; i++) {
      const card: NWCard = {
        id: quizCards[i].id,
        networkId: networkId,
        quiz_id: quizCards[i].quiz_id,
        ctext: quizCards[i].c_text,
        csubtext: (quizCards[i].c_subtext) ? quizCards[i].c_subtext : '',
        canswer: quizCards[i].c_correct,
        cstudy: quizCards[i].c_correct,
        csubstudy: '',
        cardorder: quizCards[i].cardorder,
        cimage: '',
        caudio: ''
      };
      newCards.push(card);
    }
    await this.firestoreService.saveCloudSetCards(networkId, newCards, 'network_quizzes');
  }

  async changeCat() {
    switch (this.current_cat) {
      case 'Languages':
        this.subcat = this.lang_subcat;
        break;
      case 'Subjects':
        this.subcat = this.subj_subcat;
        break;
      case 'Other':
        this.subcat = this.oth_subcat;
        break;
      default:
        this.subcat = [];
    }
    this.current_subcat = '';
  }
}
