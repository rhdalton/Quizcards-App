import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Quizdata {
  public updateQuiz: boolean;
  public updateCard: boolean;
  public updateCount: boolean;
  public addCard: boolean;
  public newQuizdata: any;
  public newCarddata: any;
  public ccc: number;
  public refreshquiz: boolean;

  constructor() {
    this.updateQuiz = false;
    this.updateCard = false;
    this.updateCount = false;
    this.addCard = false;
    this.refreshquiz = false;
    this.ccc = 0;
    this.newQuizdata = {
      quizname: '',
      quizcolor: '',
      cardcount: 0
    };
    this.newCarddata = {
      id: '',
      c_text: '',
      c_study: '',
      c_image: '',
      c_audio: '',
      cardorder: 0
    };
  }

  updateQuizData(quiz) {
    this.newQuizdata.quizname = quiz.quizname;
    this.newQuizdata.quizcolor = quiz.quizcolor;
    this.updateQuiz = true;
  }
  updateQuizcount(count: number) {
    this.newQuizdata.cardcount = count;
    this.updateCount = true;
  }
  updateCardData(card) {
    const newcard = this.updateCardDataObj(card);
    this.newCarddata = newcard;
    this.updateCard = true;
  }
  addCardData(card) {
    const newcard = this.updateCardDataObj(card);
    this.newCarddata = newcard;
    this.addCard = true;
  }

  updateCardDataObj(card) {
    return  {
      id: card.id,
      c_text: card.c_text,
      c_study: card.c_study,
      c_image: card.c_image,
      c_audio: card.c_audio,
      cardorder: card.cardorder
    };
  }
}
