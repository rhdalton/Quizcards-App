import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FSQuiz } from '../models/fsquiz';
import * as firebase from 'firebase/app';
import { File } from '@ionic-native/File/ngx';
import { NWQuiz } from '../models/fsnetwork';
import { Achievements } from '../shared/classes/achievements';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { FSShared } from 'src/app/models/fsshared';
import { Card } from 'src/app/models/card';
import { ExportQuiz } from '../models/exportquiz';
import { Networkcategories } from '../shared/classes/networkcategories';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(
    private fs: AngularFirestore,
    private file: File,
    private achieve: Achievements,
    private toast: ToastNotification,
    private category: Networkcategories
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

  async saveCloudCardSet(quiz: any, collection: string) {
    const batch = this.fs.firestore.batch();
    const newFSQuiz = this.fs.firestore.collection(collection).doc();

    if (collection === 'user_cardsets') quiz.cloudId = newFSQuiz.id;
    else if (collection === 'user_shared_cardsets') quiz.shareId = newFSQuiz.id;
    else if (collection === 'network_quizzes') quiz.networkId = newFSQuiz.id;

    batch.set(newFSQuiz, quiz);
    await batch.commit();
    return newFSQuiz;
  }

  async updateCloudCardSet(quiz: any, collection) {
    let docId;
    if (collection === 'user_cardsets') docId = quiz.cloudId;
    else if (collection === 'user_shared_cardsets') docId = quiz.shareId;
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
    const batch = this.fs.firestore.batch();
    for (let i = 0; i < cards.length; i++) {
      const cardRef = this.fs.firestore.collection(collection).doc(cloudId).collection('cards').doc();
      cards[i].cardorder = i + 1;
      batch.set(cardRef, cards[i]);

      if (withImages && cards[i].c_image && cards[i].c_image !== '') {
        this.uploadStorageImage(cloudId, cards[i].image_path, 'cloud');
      }
    }
    await batch.commit();
  }

  async uploadStorageImage(cloudId: string, image_path: string, base: string) {
    const storageloc = base + '/' + cloudId;
    const storageRef = firebase.storage().ref();
    const fp = image_path.substr(0, image_path.lastIndexOf('/') + 1);
    const fn = image_path.substr(image_path.lastIndexOf('/') + 1);
    // this.toast.loadToast('Uploading image... ' + i);
    this.file.readAsArrayBuffer(fp, fn).then(ab => {
      const blob = new Blob([ab], {type: 'image/jpg'});
      storageRef.child(storageloc + '/' + fn).put(blob);
    });
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
    return this.fs.firestore.collection('user_shared_cardsets')
      .where('shareCode', '==', code)
      .get();
  }

  async getNetworkQuizzes(doc = '', cat = '', subcat = '') {

    if (subcat) return this.getNetworkQuizzesBySubcat(doc, cat, subcat);
    else if (cat) return this.getNetworkQuizzesByCat(doc, cat);
    else return this.getNetworkQuizzesLatest(doc);
  }

  private async getNetworkQuizzesLatest(doc) {
    if (doc) {
      const docRef = this.fs.firestore.collection('network_quizzes').doc(doc);
      return (await docRef.get().then(snapshot => {
        const startAtSnapshot = this.fs.firestore.collection('network_quizzes')
          .where('isActive', '==', true)
          .orderBy('quizpublishtimestamp', 'desc')
          .startAfter(snapshot);

        return startAtSnapshot.limit(15).get();
      })).docs
      .map(q => {
        return {
          ...q.data()
        } as NWQuiz;
      });
    } else {
      return (await this.fs.firestore.collection('network_quizzes')
          .where('isActive', '==', true)
          .orderBy('quizpublishtimestamp', 'desc')
          .limit(15)
          .get())
        .docs
        .map(q => {
          return {
            ...q.data()
          } as NWQuiz;
        });
    }
  }

  private async getNetworkQuizzesByCat(doc, cat) {
    if (doc) {
      const docRef = this.fs.firestore.collection('network_quizzes').doc(doc);
      return (await docRef.get().then(snapshot => {
        const startAtSnapshot = this.fs.firestore.collection('network_quizzes')
          .where('isActive', '==', true)
          .where('quizcategory', '==', cat)
          .startAfter(snapshot);

        return startAtSnapshot.limit(15).get();
      })).docs
      .map(q => {
        return {
          ...q.data()
        } as NWQuiz;
      });
    } else {
      return (await this.fs.firestore.collection('network_quizzes')
          .where('isActive', '==', true)
          .where('quizcategory', '==', cat)
          .limit(15)
          .get())
        .docs
        .map(q => {
          return {
            ...q.data()
          } as NWQuiz;
        });
    }
  }

  private async getNetworkQuizzesBySubcat(doc, cat, subcat) {
    const subcatkey = this.category.subcatKey(cat, subcat);
    if (doc) {
      const docRef = this.fs.firestore.collection('network_quizzes').doc(doc);
      return (await docRef.get().then(snapshot => {
        const startAtSnapshot = this.fs.firestore.collection('network_quizzes')
          .where('isActive', '==', true)
          .where('quizsubcatkey', '==', subcatkey)
          .startAfter(snapshot);

        return startAtSnapshot.limit(15).get();
      })).docs
      .map(q => {
        return {
          ...q.data()
        } as NWQuiz;
      });
    } else {
      return (await this.fs.firestore.collection('network_quizzes')
          .where('isActive', '==', true)
          .where('quizsubcatkey', '==', subcatkey)
          .limit(15)
          .get())
        .docs
        .map(q => {
          return {
            ...q.data()
          } as NWQuiz;
        });
    }
  }

  async getNetworkQuizCards(cloudId: string) {
    return new Promise<string>((res, rej) => {
      this.fs.firestore.collection('network_quizzes')
      .doc(cloudId)
      .get()
      .then(snapshot => {
        res(snapshot.data().quizData);
      })
      .catch(error => {
        rej();
      });
    });
  }

  async updateCloudDownloadCount(cloudId, collection) {
    const q = await this.fs.firestore.collection(collection).doc(cloudId);
    this.fs.firestore.runTransaction(t => {
        return t.get(q).then(doc => {
          t.update(q, { quizdownloads: doc.data().quizdownloads + 1 });
        });
      });
  }

  async deleteStorageFile(cloudId: string, base: string, file: string) {
    return new Promise((res) => {
      const ref = firebase.storage().ref(base + '/' + cloudId) as any;
      ref.child(file).delete();
      res();
    });
  }

  async deleteStorageFiles(cloudId: string, base: string) {
    return new Promise((res) => {
      const ref = firebase.storage().ref(base + '/' + cloudId) as any;
      // ref.child('1583876445489.jpg').delete();
      // res();
      ref.listAll()
        .then(dir => {
          dir.forEach(fileRef => {
            ref.child(fileRef).delete();
          });
          res();
        })
        .catch(() => res());
    });
  }

  async fetchStorageFiles(cloudId) {
    const ref = firebase.storage().ref(cloudId) as any;
    const dir = await ref.listAll();
    dir.items.forEach(fileRef => {
      ref.child(fileRef).getDownloadUrl();
    });
  }

  async getLatestNews() {
    return (await this.fs.firestore.collection('latest_news').doc('jsonstring').get()).data().value;
  }
}
