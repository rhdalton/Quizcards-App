import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { User } from '../models/user';
import { AppdataClass } from '../shared/classes/appdata';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private fs: AngularFirestore,
    private app: AppdataClass) {
  }
  save(userId, lastActive) {
    this.fs.collection('users').doc(userId).update({
      lastActive: lastActive,
      appVersion: this.app.appv
    })
    .catch(e => console.log(e));
    console.log('save user');
  }

  saveProAlert(userId) {
    this.fs.collection('users').doc(userId).update({
      proAlerted: true
    })
    .catch(e => console.log(e));
  }

  // get Observable of AppUser
  getUser(uid): Observable<User> {
    return this.fs.collection('users').doc(uid)
      .valueChanges() as Observable<User>;
      // .pipe(map((user: Appuser) => {
      //   return user;
      // }));
  }
}
