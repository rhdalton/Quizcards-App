import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Quiz } from '../models/quiz';
import { Card } from '../models/card';

@Injectable({
  providedIn: 'root'
})
export class WebstorageService {

  constructor(
    private storage: Storage
  ) { }

  async getQuizlist() {
    return JSON.parse(await this.storage.get('quizlist')) || [];
  }

  async saveQuizList(quizlist) {
    await this.storage.set('quizlist', JSON.stringify(quizlist));
  }

  async saveQuizById(quiz) {
    await this.storage.set(quiz.id, JSON.stringify(quiz));
  }

  async getQuizById(quizId) {
    return JSON.parse(await this.storage.get(quizId)) || {};
  }

  async saveQuizInQuizlist(quiz) {
    const quizlist = await this.getQuizlist();
    for (let i = 0; i < quizlist.length; i++) {
      if (quizlist[i].id === quiz.id) {
        quizlist[i] = quiz;
        break;
      }
    }
    await this.saveQuizList(quizlist);
  }

  async deleteQuiz(quizId) {
    await this.storage.remove(quizId);
    await this.storage.remove(quizId + '-cards');
    const allquizes = await this.getQuizlist();
    for (let i = 0; i < allquizes.length; i++) {
      if (allquizes[i].id === quizId) {
        allquizes.splice(i, 1);
        break;
      }
    }
    await this.saveQuizList(allquizes);
  }

  async updateCloudQuiz(quiz: Quiz) {
    const quizlist = await this.getQuizlist();
    // search 'quizlist' array for this quiz to update
    for (let i = 0; i < quizlist.length; i++) {
      if (quizlist[i].id === quiz.id) {
        quizlist[i] = quiz;
        break;
      }
    }
    await this.saveQuizList(quizlist);
  }

  async getQuizCards(quizId) {
    return JSON.parse(await this.storage.get(quizId + '-cards')) || [];
  }

  async saveQuizCards(cards, quizId) {
    await this.storage.set(quizId + '-cards', JSON.stringify(cards));
    await this.updateQuizCardCount(quizId, cards.length);
  }

  async updateQuizCard(card: Card) {
    const cards = await this.getQuizCards(card.quiz_id);
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].id === card.id) {
        cards[i] = card;
        break;
      }
    }
    this.saveQuizCards(cards, card.quiz_id);
  }

  async updateQuizCardCount(quizId, count) {
    const quizlist: Quiz[] = await this.getQuizlist();
    for (let i = 0; i < quizlist.length; i++) {
      if (quizlist[i].id === quizId) {
        quizlist[i].cardcount = count;
        await this.saveQuizById(quizlist[i]);
        break;
      }
    }
    await this.saveQuizList(quizlist);
  }

  async deleteCard(cardId, cardlist, quizId) {
    let splice: number;
    let neworder = 0;

    for (let i = 0; i < cardlist.length; i++) {
      if (cardlist[i].id === cardId) {
        splice = i;
        // if (cardlist[i].image_path && cardlist[i].image_path !== '') this.images.deleteImage(cardlist[i].image_path);
      } else {
        neworder++;
        cardlist[i].cardorder = neworder;
      }
    }
    cardlist.splice(splice, 1);
    await this.saveQuizCards(cardlist, quizId);
    return cardlist;
  }

  async reorderCards(cards: Card[]) {
    await this.storage.set(cards[0].quiz_id + '-cards', JSON.stringify(cards));
  }

  async updateQuizFirestoreId(quizId, fsId, type) {
    const quiz: Quiz = await this.getQuizById(quizId);
    if (quiz) {
      if (type === 'cloud') quiz.cloudId = fsId;
      else if (type === 'share') quiz.shareId = fsId;
      else if (type === 'network') quiz.networkId = fsId;
      await this.saveQuizById(quiz);

      const quizzes = await this.getQuizlist();
      for (let i = 0; i < quizzes.length; i++) {
        if (quizzes[i].id === quizId) {
          if (type === 'cloud') quizzes[i].cloudId = fsId;
          else if (type === 'share') quizzes[i].shareId = fsId;
          else if (type === 'network') quizzes[i].networkId = fsId;
          break;
        }
      }
      await this.saveQuizList(quizzes);
    }
  }

  setProUpgradePrice(price) {
    this.storage.set('proprice', JSON.stringify(price));
  }

  async getProUpgradePrice() {
    return JSON.parse(await this.storage.get('proprice'));
  }
}
