import { Component, OnInit, Input } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore.service';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { ComDownloadComponent } from '../com-download/com-download.component';
import { NetworkService } from 'src/app/services/network.service';
import { Networkcategories } from 'src/app/shared/classes/networkcategories';

@Component({
  selector: 'app-com-home',
  templateUrl: './com-home.component.html',
  styleUrls: ['./com-home.component.scss'],
})
export class ComHomeComponent implements OnInit {
  _loader;
  allQuizLists: any[] = [];
  currentQuizList: NWQuiz[];
  catList: any[];
  subcatList: any[];
  current_cat_key = "latest";
  current_cat = "";
  current_subcat = "";
  noMore = false;

  constructor(
    private firestoreService: FirestoreService,
    private load: LoadingController,
    private modal: ModalController,
    private network: NetworkService,
    private categroy: Networkcategories
  ) { }

  async ngOnInit() {
    await this.updateQuizList();
    this.catList = this.categroy.getCatList();
  }

  async updateQuizList() {
    if (!this.allQuizLists[this.current_cat_key]) {
      if (this.network.isOnline()) {
        this._loader = await this.load.create({ message: 'Loading Community Cards...'});
        this._loader.present();
        console.log('fetching..');
      }
      this.allQuizLists[this.current_cat_key] = [];
      this.allQuizLists[this.current_cat_key] = await this.firestoreService.getNetworkQuizzes('', this.current_cat, this.current_subcat);
      this._loader.dismiss();
    }
    this.currentQuizList = this.allQuizLists[this.current_cat_key];
    if (this.currentQuizList.length < 15) this.noMore = true;
  }

  async downloadQuizModal(quiz) {
    this.modal.create({
      component: ComDownloadComponent,
      componentProps: {
        modal: this.modal,
        quiz: quiz,
      },
      cssClass: 'download-modal'
    }).then(m => m.present());
  }

  async changeCat() {
    this.noMore = false;
    if (this.current_cat) {
      this.subcatList = this.categroy.getSubCats(this.current_cat);
      this.current_cat_key = this.current_cat;
    } else {
      // this.filterQuizzes = this.allQuizzes;
      this.current_cat_key = 'latest';
    }
    this.current_subcat = '';
    await this.updateQuizList();
  }

  async changeSubcat() {
    this.noMore = false;
    if (this.current_subcat) this.current_cat_key = this.categroy.subcatKey(this.current_cat, this.current_subcat);
    else this.current_cat_key = this.current_cat;
    await this.updateQuizList();
  }

  async loadMore(e) {

    if (this.allQuizLists[this.current_cat_key].length < 6 || this.noMore) {
      e.target.complete();
      return;
    }

    const lastQuiz = this.allQuizLists[this.current_cat_key][this.allQuizLists[this.current_cat_key].length - 1];
    const addQuizzes = await this.firestoreService.getNetworkQuizzes(lastQuiz.networkId, this.current_cat, this.current_subcat);
    if (addQuizzes.length === 0) {
      // e.target.disabled = true;
      e.target.complete();
      this.noMore = true;
    } else {
      this.allQuizLists[this.current_cat_key] = this.allQuizLists[this.current_cat_key].concat(addQuizzes);
      this.currentQuizList = this.allQuizLists[this.current_cat_key];
      if (addQuizzes.length < 15) {
        this.noMore = true;
      }
      e.target.complete();
      console.log('added');
    }
  }
}
