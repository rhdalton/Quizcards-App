import { Component, OnInit } from '@angular/core';
import { NavParams, LoadingController, AlertController } from '@ionic/angular';
import { Quiz } from 'src/app/models/quiz';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { User } from 'src/app/models/user';
import { Networkcategories } from 'src/app/shared/classes/networkcategories';
import { firestore } from 'firebase/app';
import { FirestoreService } from 'src/app/services/firestore.service';
import { SqliteService } from 'src/app/services/sqlite.service';
import { Card } from 'src/app/models/card';
import { NWCard } from 'src/app/models/nwcard';
import { QuizcardsExport } from 'src/app/shared/classes/quizcardsexport';
import { Router } from '@angular/router';

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
  uploadButton = 'Upload';
  categoryList;
  subcatList = [];
  lang_subcat;
  subj_subcat;
  oth_subcat;
  current_cat = '';
  current_subcat = '';
  quizdesc = '';
  alertMessage = '';

  constructor(
    private firestoreService: FirestoreService,
    private sqlite: SqliteService,
    private cats: Networkcategories,
    private params: NavParams,
    private load: LoadingController,
    private exportquiz: QuizcardsExport,
    private alert: AlertController,
    private router: Router
  ) {
    this.modal = this.params.get('modal');
    this.Quiz = this.params.get('quiz');
    this.NWQuiz = this.params.get('nwquiz');
    this.User = this.params.get('user');
    this.categoryList = this.cats.getCategoryList;
    this.lang_subcat = this.cats.getLang_subcat;
    this.subj_subcat = this.cats.getSubj_subcat;
    this.oth_subcat = this.cats.getOth_subcat;
  }

  ngOnInit() {
    // console.log(this.Quiz);
    if (this.Quiz.networkId) {
      this.uploadButton = 'Upload Changes';
      if (this.NWQuiz) {
        this.current_cat = this.NWQuiz.quizcategory;
        this.changeCat();
        this.current_subcat = this.NWQuiz.quizsubcat;
        this.quizdesc = this.NWQuiz.quizdesc;
      }
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

    this._loader = await this.load.create({ message: 'Uploading QuizCard set...' });
    this._loader.present();

    const quizCards: Card[] = await this.sqlite.getQuizCards(this.Quiz.id);
    const quizJsonString = this.exportquiz.quizToJson(this.Quiz, quizCards);

    // Upload REPLACEMENT QUIZ
    if (this.Quiz.networkId && this.Quiz.networkId !== '' && this.NWQuiz) {

      const updateQuiz: NWQuiz = {
        ...this.NWQuiz,
        quizname: this.Quiz.quizname,
        quizcolor: this.Quiz.quizcolor,
        quizdesc: form.quizdesc,
        cardcount: this.Quiz.cardcount,
        quizcategory: form.current_cat,
        quizsubcat: form.current_subcat,
        quizsubcatkey: this.cats.subcatKey(form.current_cat, form.current_subcat),
        quizpublishdate: firestore.Timestamp.now().toDate(),
        quizpublishtimestamp: firestore.Timestamp.now().seconds,
        quizData: quizJsonString,
        quizdownloads: 0,
        quizrating: 0
      };

      await this.firestoreService.updateCloudCardSet(updateQuiz, 'network_quizzes');

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
        quizsubcatkey: this.cats.subcatKey(form.current_cat, form.current_subcat),
        quizauthor: this.User.displayName,
        quizpublishdate: firestore.Timestamp.now().toDate(),
        quizpublishtimestamp: firestore.Timestamp.now().seconds,
        audioData: '',
        imageData: '',
        quizData: quizJsonString,
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
      this.Quiz.networkId = result.id;

      // await this.addNetworkCards(result.id);
    }
    this.modal.dismiss();
    this.router.navigate(['/tabs/tabhome']);
    this._loader.dismiss();
    this.alert.create({
      header: 'Upload Success!',
      message: 'You\'ve successfully uploaded this QuizCard set to the community! If you make changes to this set, you can update the community set by uploading again.',
      buttons: ['OK']
    }).then(a => a.present());
  }

  async changeCat() {
    if (this.current_cat) {
      this.subcatList = this.cats.getSubCats(this.current_cat);
    } else {
      this.current_subcat = "";
    }
  }
}
