import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { User } from '../models/user';
import { UserService } from './user.service';
import { FirestoreService } from './firestore.service';
import { Achievements } from '../shared/classes/achievements';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<firebase.User>;

  constructor(
    private afAuth: AngularFireAuth,
    private fs: FirestoreService,
    private ach: Achievements,
    private userService: UserService) {
      this.user$ = this.afAuth.authState;
  }

  async registerUser(credentials) {
    return await this.afAuth.auth.createUserWithEmailAndPassword(credentials.email, credentials.password);
  }

  async login(user) {
    return await this.afAuth.auth.signInWithEmailAndPassword(user.email.trim(), user.password.trim())
      .then(async (resultUser) => {
        return resultUser;
      })
      .catch(error => {
        if (error.code === 'auth/wrong-password') return 'Invalid Email or Password.';
        else if (error.code === 'auth/user-not-found') return 'This Email address not found.';
        else if (error.code === 'auth/user-disabled') return 'This account has been disabled. Please contact quizcardsapps@gmail.com for more information.';
        else {
          console.log(error);
          return error.message;
        }
      });
  }

  async loginWithGoogle() {
    // await this.afAuth.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
  }

  logOut() {
    this.afAuth.auth.signOut();
  }

  async resetPassword(email) {
    return this.afAuth.auth.sendPasswordResetEmail(email)
      .then(result => {
        return 'success';
      })
      .catch(error => {
        return error;
      });
  }

  get appUser$(): Observable<User> {
    return this.user$
      .pipe(switchMap(user => {
        if (user) return this.userService.getUser(user.uid);
        return of(null);
      }));
  }
}
