import { Component, OnInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { LoadingController } from '@ionic/angular';
import { NWQuiz } from 'src/app/models/fsnetwork';

@Component({
  selector: 'app-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
})
export class CommunityComponent implements OnInit {
  _loader;
  tab: string;
  allQuizzes: NWQuiz[];

  constructor(
    private firestoreService: FirestoreService,
    private load: LoadingController,
  ) { }

  async ngOnInit() {
    this.tab = 'browse';
  }

  segmentChanged(ev) {
    console.log(ev.detail.value);
    this.tab = ev.detail.value;
  }
}
