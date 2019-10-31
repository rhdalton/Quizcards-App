import { Component, OnInit } from '@angular/core';
import { LoadingController, ModalController } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore.service';
import { NWQuiz } from 'src/app/models/fsnetwork';
import { ComDownloadComponent } from '../com-download/com-download.component';
import { NetworkService } from 'src/app/services/network.service';

@Component({
  selector: 'app-com-home',
  templateUrl: './com-home.component.html',
  styleUrls: ['./com-home.component.scss'],
})
export class ComHomeComponent implements OnInit {
  _loader;
  Quizzes: NWQuiz[];

  constructor(
    private firestoreService: FirestoreService,
    private load: LoadingController,
    private modal: ModalController,
    private network: NetworkService
  ) { }

  async ngOnInit() {
    this._loader = await this.load.create({ message: 'Loading Community Cards...'});
    this._loader.present();

    this.getQuizzes();
   }

  async getQuizzes() {
    const allquizzes = await this.firestoreService.getNetworkQuizzes();
    this.Quizzes = allquizzes;
    this._loader.dismiss();
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

}
