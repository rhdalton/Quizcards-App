import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FSQuiz } from '../models/fsquiz';
import * as firebase from 'firebase/app';
import { File } from '@ionic-native/File/ngx';
import { NWQuiz } from '../models/fsnetwork';
import { Achievements } from '../shared/classes/achievements';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(
    private fs: AngularFirestore,
    private file: File,
    private achieve: Achievements
  ) { }

  getFirestoreUserByName(name) {
    return this.fs.firestore.collection('users')
      .where('userName', '==', name)
      .get();
  }

  setFirestoreUser(user) {
    this.fs.firestore.collection('users').doc(user.uid).set(user);
  }

  async getUserAchievements(user) {
    return await this.fs.firestore.collection('users').doc(user.uid).collection('badges').get();
  }

  async setAchievements(user, ach) {
    const achdetail = this.achieve.achievementDetails();
    for (const a of ach) {
      if (a.count > 0) {
        await this.fs.firestore.collection('users').doc(user.uid).collection('badges').doc(achdetail[a.id].name).set({
          count: a.count,
          rank: a.rank
        });
      }
    }
  }

  updateAchievement(user, achname, achdata) {
    this.fs.firestore.collection('users').doc(user.uid).collection('badges').doc(achname).set({
      count: achdata.count,
      rank: achdata.rank
    });
  }

  getUserCloudBackups(user_id) {
    return this.fs.firestore.collection('user_cardsets')
    .where('user_id', '==', user_id)
    .get();
  }

  async getFirestoreQuiz(cloudId, collection) {
    return await this.fs.firestore.collection(collection).doc(cloudId).get();
  }

  async deleteCloudCardSet(cloudId, collection) {
    await this.fs.firestore.collection(collection).doc(cloudId).delete();
  }

  async saveCloudCardSet(quiz: any, collection) {
    const batch = this.fs.firestore.batch();
    const newFSQuiz = this.fs.firestore.collection(collection).doc();

    if (collection === 'user_cardsets') quiz.cloudId = newFSQuiz.id;
    else if (collection === 'user_shared_quizzes') quiz.shareId = newFSQuiz.id;
    else if (collection === 'network_quizzes') quiz.networkId = newFSQuiz.id;

    batch.set(newFSQuiz, quiz);
    await batch.commit();
    return newFSQuiz;
  }

  async updateCloudCardSet(quiz: any, collection) {
    let docId;
    if (collection === 'user_cardsets') docId = quiz.cloudId;
    else if (collection === 'user_shared_quizzes') docId = quiz.shareId;
    else if (collection === 'network_quizzes') docId = quiz.networkId;

    if (docId) await this.fs.firestore.collection(collection).doc(docId).set(quiz);
  }

  async getCloudSetCards(docId, collection) {
    return await this.fs.firestore.collection(collection).doc(docId).collection('cards')
      .orderBy('cardorder')
      .get();
  }

  async saveCloudSetCards(cloudId, cards, collection, withImages = false) {
    await this.deleteCloudSetCards(cloudId, collection);
    const storageRef = firebase.storage().ref();
    const batch = this.fs.firestore.batch();
    for (let i = 0; i < cards.length; i++) {
      const cardRef = this.fs.firestore.collection(collection).doc(cloudId).collection('cards').doc();
      cards[i].cardorder = i + 1;
      batch.set(cardRef, cards[i]);

      if (withImages && cards[i].c_image && cards[i].c_image !== '') {
        // this.toast.loadToast('uploading image ' + i);
        const fp = cards[i].image_path.substr(0, cards[i].image_path.lastIndexOf('/') + 1);
        const fn = cards[i].image_path.substr(cards[i].image_path.lastIndexOf('/') + 1);
        this.file.readAsArrayBuffer(fp, fn).then(ab => {
          const blob = new Blob([ab], {type: 'image/jpeg'});
          storageRef.child(cloudId + '/' + fn).put(blob);
        });
      }
    }
    await batch.commit();
  }

  async deleteCloudSetCards(cloudId, collection) {
    const cardsToDelete = await this.fs.firestore.collection(collection).doc(cloudId).collection('cards').get();
    if (cardsToDelete) {
      const storageRef = firebase.storage().ref();
      const batch = this.fs.firestore.batch();
      cardsToDelete.forEach(async (card) => {
        if (card.data().c_image && card.data().c_image !== '') {
          const fn = card.data().c_image.substr(card.data().c_image.lastIndexOf('/') + 1);
          storageRef.child(cloudId + '/' + fn).delete();
        }
        batch.delete(card.ref);
      });
      await batch.commit();
    }
  }

  async upgradeUserToPro(user, product) {
    this.fs.collection('users').doc(user.uid).update({ userStatus: 'pro' });
    this.fs.collection('pro_upgrades').add({
      user_id: user.uid,
      user_name: user.displayName,
      date: firebase.firestore.Timestamp.now(),
      price: product.price,
      currency: product.currency
    });
  }

  async getShareQuizByCode(code: string) {
    return this.fs.firestore.collection('user_shared_quizzes')
      .where('sharecode', '==', code)
      .get();
  }

  async getNetworkQuizzes() {
    return (await this.fs.firestore.collection('network_quizzes')
      .where('isActive', '==', true)
      .get())
      .docs
      .map(q => {
        return {
          ...q.data()
        } as NWQuiz;
      });
  }

  async updateNetworkDownloadCount(networkId) {
    const q = await this.fs.firestore.collection('network_quizzes').doc(networkId);
    this.fs.firestore.runTransaction(t => {
        return t.get(q).then(doc => {
          t.update(q, { quizdownloads: doc.data().quizdownloads + 1 });
        });
      });
  }
}
