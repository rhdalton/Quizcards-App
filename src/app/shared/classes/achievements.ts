import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AchievealertComponent } from '../components/achievealert/achievealert.component';
import { AppdataClass } from './appdata';

const ACHIEVE_STORAGE = 'achievements';

@Injectable()
export class Achievements {

  constructor(
    private storage: Storage,
    private modal: ModalController
  ) {}

  async getAchievements() {
    // this.storage.remove(ACHIEVE_STORAGE);
    const achieve = JSON.parse(await this.storage.get(ACHIEVE_STORAGE));
    if (!achieve || achieve.length < 14) {
      const newAchieve = [
        { id: 1, count: 0, rank: 0 },
        { id: 2, count: 0, rank: 0 },
        { id: 3, count: 0, rank: 0 },
        { id: 4, count: 0, rank: 0 },
        { id: 5, count: 0, rank: 0 },
        { id: 6, count: 0, rank: 0 },
        { id: 7, count: 0, rank: 0 },
        { id: 8, count: 0, rank: 0 },
        { id: 9, count: 0, rank: 0 },
        { id: 10, count: 0, rank: 0 },
        { id: 11, count: 0, rank: 0 },
        { id: 14, count: 0, rank: 0 },
        { id: 12, count: 0, rank: 0 },
        { id: 13, count: 0, rank: 0 }
      ];
      await this.saveAchievements(newAchieve);
      return newAchieve;
    }
    // if (achieve.length < 14) {
    //   if (achieve.findIndex(x => x.id === 14) < 0) {
    //     achieve.splice(11, 0, { id: 14, count: 0, rank: 0});
    //   }

    //   await this.saveAchievements(achieve);
    // }
    return achieve;
  }

  async saveAchievements(achieve) {
    await this.storage.set(ACHIEVE_STORAGE, JSON.stringify(achieve));
  }

  async clearAchievements() {
    await this.storage.remove(ACHIEVE_STORAGE);
  }

  async updateLocalAchievement(aid, addcount) {
    const achieveList = await this.getAchievements();
    const achId = achieveList.findIndex(x => x.id === aid);
    const achdetails = this.achievementDetails();

    const currentrank = achieveList[achId].rank;
    achieveList[achId].count += addcount;

    for (let i = 4; i >= 1; i--) {
      if (achdetails[aid].badges[i - 1] && achieveList[achId].count >= achdetails[aid].badges[i - 1].count && currentrank < i) {
        achieveList[achId].rank = i;
        this.achievementAlert(achieveList[achId]);
      }
    }
    await this.saveAchievements(achieveList);
    console.log('achieve saved', achieveList[achId]);
  }

  async resetLocalAchievement(aid) {
    const achieveList = await this.getAchievements();
    const achId = achieveList.findIndex(x => x.id === aid);
    achieveList[achId].count = 1;
    await this.saveAchievements(achieveList);
  }

  async achievementAlert(achdata) {
    console.log('open alert', achdata);
    this.modal.create({
      component: AchievealertComponent,
      componentProps: {
        modal: this.modal,
        achdata: achdata,
        achdetails: this.achievementDetails()
      },
      cssClass: 'download-modal'
    }).then(m => m.present());
  }


  achievementDetails() {
    return {
      1: {
        name: 'quizcards_pro',
        title: 'Pro Account',
        desc: 'Upgrade to a QuizCards Pro account.',
        badges: [
          { count: 1, desc: 'Pro Account', title: 'QuizCards-4-Life' }
        ]
      },
      2: {
        name: 'app_installed',
        title: 'App Installed',
        desc: 'Keep QuizCards App installed on your device.',
        badges: [
          { count: 30, desc: '1 month', title: 'QuizCards User' },
          { count: 90, desc: '3 months', title: 'QuizCards Fan' },
          { count: 180, desc: '6 months', title: 'QuizCards Loyalist' },
          { count: 365, desc: '1 year', title: 'QuizCards Cultist' }
        ]
      },
      3: {
        name: 'app_used',
        title: 'Study Daily',
        desc: 'Study at least 10 cards every day continuously.',
        badges: [
          { count: 7, desc: '7 days in a row', title: 'QuizCards Devotee' },
          { count: 15, desc: '15 days in a row', title: 'QuizCards Junkie' }
        ]
      },
      4: {
        name: 'study_cards',
        title: 'Study Cards',
        desc: 'Review study cards.',
        badges: [
          { count: 100, desc: 'Review 100 cards', title: 'Study Student' },
          { count: 500, desc: 'Review 500 cards', title: 'Study Savvy' },
          { count: 2500, desc: 'Review 2,500 cards', title: 'Study Scholar' },
          { count: 5000, desc: 'Review 5,000 cards', title: 'Study Savant' },
        ]
      },
      5: {
        name: 'quiz_cards',
        title: 'Quiz Cards',
        desc: 'Answer quiz questions.',
        badges: [
          { count: 50, desc: 'Answer 50 cards', title: 'Quiz Dabbler' },
          { count: 250, desc: 'Answer 200 cards', title: 'Quiz Veteran' },
          { count: 1000, desc: 'Answer 1,000 cards', title: 'Quiz Maven' },
          { count: 3000, desc: 'Answer 3,000 cards', title: 'Quiz Addict' },
        ]
      },
      6: {
        name: 'multi_quiz',
        title: 'Multiple Choice',
        desc: 'Complete multiple choice quizzes. (10 cards or more)',
        badges: [
          { count: 3, desc: '3 quizzes', title: 'Multi-Casual' },
          { count: 20, desc: '20 quizzes', title: 'Multi-Tasker' },
          { count: 100, desc: '100 quizzes', title: 'Multi-Talented' },
          { count: 500, desc: '500 quizzes', title: 'Multi-Master' },
        ]
      },
      7: {
        name: 'typein_quiz',
        title: 'Type-in Quiz',
        desc: 'Complete type-in quizzes. (10 cards or more)',
        badges: [
          { count: 3, desc: '3 quizzes', title: 'One-finger Typer' },
          { count: 20, desc: '20 quizzes', title: 'Typing Talent' },
          { count: 100, desc: '100 quizzes', title: 'Keyboard Warrior' },
          { count: 500, desc: '500 quizzes', title: 'Keyboard Crazy' },
        ]
      },
      8: {
        name: 'perfect_multi',
        title: 'Perfect Multi',
        desc: 'Get a perfect score on a Multiple choice quiz.',
        badges: [
          { count: 1, desc: '10+ card quiz', title: 'Perfect Guesser' },
          { count: 2, desc: '25+ card quiz', title: 'Memory Master' },
          { count: 3, desc: '40+ card quiz', title: 'Dictionary Reader' }
        ]
      },
      9: {
        name: 'perfect_typein',
        title: 'Perfect Type-in',
        desc: 'Get a perfect score on a Type-in quiz.',
        badges: [
          { count: 1, desc: '10+ card quiz', title: 'Perfect Speller' },
          { count: 2, desc: '25+ card quiz', title: 'Spelling Bee Wizz' },
          { count: 3, desc: '40+ card quiz', title: 'Copy & Paste Master' }
        ]
      },
      10: {
        name: 'create_set',
        title: 'Create Sets',
        desc: 'Create QuizCard sets.',
        badges: [
          { count: 1, desc: 'Create 1 set', title: 'One Set Wonder' },
          { count: 10, desc: 'Create 10 sets', title: 'Ready Sets Go' },
          { count: 50, desc: 'Create 50 sets', title: 'Hit the Decks' },
          { count: 100, desc: 'Create 100 sets', title: 'Way Over Achiever' },
        ]
      },
      11: {
        name: 'create_card',
        title: 'Create Cards',
        desc: 'Create cards.',
        badges: [
          { count: 10, desc: 'Create 10 cards', title: 'Can Count to Ten' },
          { count: 100, desc: 'Create 100 cards', title: 'Card Dealer' },
          { count: 300, desc: 'Create 300 cards', title: 'Card Magician' },
          { count: 1000, desc: 'Create 1,000 cards', title: 'Card Obessed' },
        ]
      },
      12: {
        hidden: 1,
        name: 'shared',
        title: 'Share Cardset',
        desc: 'Share a card set.',
        badges: [
          { count: 1, desc: 'Share 1 set', title: 'Sharing is Caring' },
          { count: 5, desc: 'Share 5 sets', title: 'Card Dealer' },
          { count: 20, desc: 'Share 20 sets', title: 'Card C' },
          { count: 50, desc: 'Share 50 sets', title: 'Copy & Paster' },
        ]
      },
      13: {
        name: 'rainbow',
        title: 'Secret Achievement',
        desc: 'A secret achievement that is gained by completing a hidden task.',
        badges: [
          { count: 1, desc: 'Secret task', title: 'Secret title', secret: 'Follow the Rainbow' }
        ]
      },
      14: {
        name: 'edit_card',
        title: 'Edit Cards',
        desc: 'Edit cards.',
        badges: [
          { count: 5, desc: 'Edit 5 cards', title: 'Mistakes Happen' },
          { count: 25, desc: 'Edit 25 cards', title: 'The Editor' },
          { count: 100, desc: 'Edit 100 cards', title: 'The Perfectionist' },
          { count: 250, desc: 'Edit 250 cards', title: 'A little OCD' },
        ]
      },
    };
  }
}
