import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams, PopoverController, AlertController, ModalController } from '@ionic/angular';
import { SqliteService } from 'src/app/services/sqlite.service';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { NetworkService } from 'src/app/services/network.service';


@Component({
  selector: 'app-cardsetpopover',
  template: `
  <ion-list class="popover">
    <ion-item-divider (click)="editName()">
      <img src="assets/icon/edit.svg"> Edit
    </ion-item-divider>
    <ion-item-divider (click)="archiveQuiz()">
      <img src="assets/icon/archive.svg"> Archive
    </ion-item-divider>
    <ion-item-divider *ngIf="isBackable" (click)="backupToCloud()">
        <img src="assets/icon/backup.svg"> Back-up
    </ion-item-divider>
    <ion-item-divider *ngIf="isShareable" (click)="share()">
        <img src="assets/icon/share.svg"> Share
    </ion-item-divider>
    <ion-item-divider *ngIf="isMergeable" (click)="mergeSets()">
        <img src="assets/icon/merge.svg"> Merge
    </ion-item-divider>
    <ion-item-divider (click)="sortSet()">
        <img src="assets/icon/sort.svg"> Sort
    </ion-item-divider>
    <ion-item-divider (click)="deleteQuizAlert()" lines="none">
        <img src="assets/icon/trashcan.svg"> Delete
    </ion-item-divider>
  </ion-list>
  `,
  styles: []
})
export class CardsetpopoverComponent {
  pop: PopoverController;
  quizid;
  isBackable;
  isMergeable;
  isShareable;

  constructor(
    private router: Router,
    private params: NavParams,
    private alert: AlertController,
    private sqlite: SqliteService,
    private toast: ToastNotification,
    private network: NetworkService) {

    this.quizid = params.get('quizid');
    this.pop = params.get('popover');
    this.isBackable = (params.get('isBackable') === 1) ? true : false;
    this.isMergeable = (params.get('isMergeable') === 1) ? true : false;
    this.isShareable = (params.get('isShareable') === 1) ? true : false;
  }

  editName() {
    this.pop.dismiss();
    this.router.navigate(['/tabs/tabmanage/quiz', this.quizid]);
  }

  async deleteQuizAlert() {
    this.pop.dismiss();
    this.alert.create({
      header: 'Delete Card Set',
      message: 'Are you sure you want to delete this Card Set? This will delete all cards in the set and this action cannot be un-done.',
      buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => {}},
          { text: 'Yes', handler: () => this.deleteQuiz() }
        ]
    }).then(a => a.present());
  }

  async deleteQuiz() {
    await this.sqlite.deleteQuiz(this.quizid);
    this.toast.loadToast('Card set deleted.');
    this.router.navigate(['/tabs/tabhome']);
  }

  mergeSets() {
    this.params.get('mergeModal')();
  }

  async sortSet() {
    this.pop.dismiss();
    this.alert.create({
      header: 'Reorder Cards',
      message: 'This will permanently re-order the cards in this set in Aphabetical order by Card Text. Click Reorder to continue.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reorder', handler: () => this.params.get('sortCards')() }
      ]
    }).then(a => a.present());
  }

  backupToCloud() {
    this.params.get('backupToCloud')();
  }

  share() {
    this.pop.dismiss();
    if (!this.network.isOnline()) {
      this.network.alertOffline('share a card set');
      return;
    }
    this.router.navigate(['/tabs/tabmore/share', this.quizid]);
  }

  async archiveQuiz() {
    this.pop.dismiss();
    await this.sqlite.setArchiveQuiz(this.quizid, 1);
    this.alert.create({
      header: 'Success',
      message: 'This Set has been archived. You can recover an archived set by going to the "More" tab.',
      buttons: ['OK']
    })
    .then(a => {
      a.present();
      this.router.navigate(['/tabs/tabhome']);
    });
  }
}
