import { Component, OnInit } from '@angular/core';
import { NavParams } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cardpopover',
  template: `
  <ion-list>
    <ion-item-divider (click)="editCard()">
      <img src="assets/icon/edit.svg"> Edit
    </ion-item-divider>
    <ion-item-divider (click)="addBefore()">
      <img src="assets/icon/add.svg"> Add Before
    </ion-item-divider>
    <ion-item-divider (click)="hide()" *ngIf="!isHidden">
      <img src="assets/icon/hide.svg"> Hide Card
    </ion-item-divider>
    <ion-item-divider (click)="unhide()" *ngIf="isHidden">
      <img src="assets/icon/unhide.svg"> Unhide Card
    </ion-item-divider>
    <ion-item-divider (click)="deleteCardAlert()" lines="none">
        <img src="assets/icon/trashcan.svg"> Delete
    </ion-item-divider>
  </ion-list>
  `,
  styles: []
})
export class CardpopoverComponent {
  _pop;
  _quizId;
  _cardId;
  _isHidden;

  constructor(
    private router: Router,
    private params: NavParams) {

    this._pop = params.get('popover');
    this._quizId = params.get('quizId');
    this._cardId = params.get('cardId');
    this._isHidden = params.get('isHidden');
  }

  editCard() {
    this._pop.dismiss();
    this.router.navigate(['/tabs/tabmanage/card', this._quizId, this._cardId]);
  }
  addBefore() {
    this.params.get('addBefore')();
  }
  hide() {
    this.params.get('hideCard')();
  }
  unhide() {
    this.params.get('unhideCard')();
  }
  deleteCardAlert() {
    this._pop.dismiss();
    this.params.get('deleteCard')();
  }
}
