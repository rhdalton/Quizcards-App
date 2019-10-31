import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { QuiztypeComponent } from '../quiztype/quiztype.component';

@Component({
  selector: 'app-quizresult',
  templateUrl: './quizresult.component.html',
  styleUrls: ['./quizresult.component.scss'],
})
export class QuizresultComponent implements OnInit {
  @Input() quizId;
  @Input() quizType;
  @Input() totalcards;
  @Input() totalCorrect;
  @Input() quizResults;
  @Input() reload;
  percentCorrect = 0;
  dasharray = '';
  showResults = false;

  constructor(
    private pop: PopoverController
  ) { }

  ngOnInit() {
    this.percentCorrect = Math.round(this.totalCorrect / this.totalcards * 100);
    this.dasharray = this.percentCorrect + ', 100';
  }

  quizTypePopover(ev) {
    this.pop.create({
      component: QuiztypeComponent,
      event: ev,
      componentProps: {
        popover: this.pop,
        quizid: this.quizId,
        reload: this.reload
      },
      cssClass: 'standard-popover quiz-popover'
    }).then(p => p.present());
  }

  viewDetailedResults() {
    this.showResults = !this.showResults;
  }

  answerDetail(id) {
    const el = document.getElementById('answer-detail-' + id) as HTMLElement;
    el.style.display = (el.style.display === 'block') ? 'none' : 'block';
  }
}
