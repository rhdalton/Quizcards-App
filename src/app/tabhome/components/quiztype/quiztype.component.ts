import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavParams, PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-quiztype',
  template: `
  <ion-list>
    <ion-item-divider>
      <strong dir="ltr">Quiz Mode:</strong>
    </ion-item-divider>
    <ion-item-divider (click)="multiChoice()">
      Multiple Choice
    </ion-item-divider>
    <ion-item-divider (click)="typeIn()" lines="none">
      Type-in Answer
    </ion-item-divider>
  </ion-list>
  `,
  styles: []
})
export class QuiztypeComponent implements OnInit {
  pop: PopoverController;
  quizId: string;
  _reload: string;

  constructor(
    private params: NavParams,
    private router: Router
  ) {
    this.pop = this.params.get('popover');
    this.quizId = this.params.get('quizid');
    this._reload = this.params.get('reload');
  }

  ngOnInit() {
  }
  multiChoice() {
    this.pop.dismiss();
    if (this._reload) this.router.navigate(['/tabs/tabhome/quiz/multi', this.quizId]);
    else this.router.navigate(['/tabs/tabhome/quiz/multi', this.quizId, 1]);
  }
  typeIn() {
    this.pop.dismiss();
    if (this._reload) this.router.navigate(['/tabs/tabhome/quiz/typein', this.quizId]);
    else this.router.navigate(['/tabs/tabhome/quiz/typein', this.quizId, 1]);
  }
}
