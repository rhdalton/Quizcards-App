import { Component, OnInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingController } from '@ionic/angular';
import { User } from 'src/app/models/user';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  alertMessage = '';
  newUser: any = {};
  usernameError: string;
  usernameValid = false;

  constructor(
    private fs: FirestoreService,
    private auth: AuthService,
    private load: LoadingController,
    private app: AppdataClass,
    private router: Router
  ) {
    this.newUser.acc_terms = true;
  }

  ngOnInit() {}

  async doRegister(formUser) {
    this.alertMessage = '';
    formUser = this.cleanObjectProps(formUser);
    console.log(formUser);
    if (formUser.displayname === '') this.alertMessage = 'User name required.';
    else if (!this.validateEmail(formUser.acc_email)) this.alertMessage = 'Invalid email address.';
    else if (formUser.acc_password.length < 6) this.alertMessage = 'Password should be at least 6 characters long.';
    else if (formUser.acc_password !== formUser.acc_repeatpwd) this.alertMessage = 'Passwords do not match.';
    else if (!formUser.acc_terms) this.alertMessage = 'You must agree to Account terms to create an account.';
    else if (!this.usernameValid) this.alertMessage = 'User name is invalid.';

    if (this.alertMessage !== '') return;

    const loader = await this.load.create({ message: 'Creating account...' });
    loader.present();

    const credentials = {
      email: formUser.acc_email,
      password: formUser.acc_password
    };
    const result: any = await this.auth.registerUser(credentials);
    console.log(result);
    if (result && result.code === 'auth/email-already-in-use') {
      loader.dismiss();
      this.alertMessage = 'This Email already has an account at QuizCards. Please login';
    } else if (!result) {
      this.alertMessage = 'An error occurred with registering. Try again or contact me at quizcardsapps@gmail.com';
    } else {
      const d = new Date();
      const datetime =  d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      const saveUser: User = {
        displayName: formUser.displayname,
        userName: formUser.displayname.toLowerCase(),
        email: result.user.email,
        emailVerified: result.user.emailVerified,
        photoURL: result.user.photoURL,
        uid: result.user.uid,
        userStatus: 'personal',
        registerDate: datetime,
        lastActive: datetime,
        appVersion: this.app.appv
      };
      await this.fs.setFirestoreUser(saveUser);
      await firebase.auth().currentUser.sendEmailVerification();
      loader.dismiss();
      this.router.navigate(['/tabs/tabaccount']);
    }
  }

  async checkUsername(field) {

    const sanitizedName = this.cleanObjectProps({ displayname: field.target.value });
    if (sanitizedName.displayname === '') {
      this.usernameValid = false;
      return;
    }

    this.usernameError = '';
    this.usernameError += !(await this.fs.getFirestoreUserByName(sanitizedName.displayname.toLowerCase())).empty ?
                            'This user name is already taken.<br>' : '';
    this.usernameError += (!this.validateUsername(sanitizedName.displayname)) ? 'User name cannot contain special characters.<br>' : '';
    this.usernameError += (sanitizedName.displayname.length < 3) ? 'User name must be at least 3 characters long.<br>' : '';
    this.usernameError += (!this.validStartChar(sanitizedName.displayname)) ? 'User name must start with a letter.' : '';

    if (this.usernameError === '') this.usernameValid = true;
    else this.usernameValid = false;
  }

  cleanObjectProps(user) {
    Object.keys(user).map(k => {
        if (user[k]) user[k] = user[k].toString().replace(/ +(?= )/g, '').trim();
        else user[k] = '';
      });
    return user;
  }

  validateUsername(name) {
    const alphaExp = /^[a-zA-Z0-9-_\s]+$/;
    if  (name.match(alphaExp)) return true;
    else return false;
  }

  validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  validStartChar(name) {
    const alphaExp = /^[a-zA-Z]+$/;
    if (name && name[0].match(alphaExp)) return true;
    return false;
  }
}
