import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Achievements } from 'src/app/shared/classes/achievements';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginUser: any = {};
  alertMessage = '';

  constructor(
    private auth: AuthService,
    private fs: FirestoreService,
    private load: LoadingController,
    private router: Router,
    private ach: Achievements
  ) {

  }

  ngOnInit() {}

  async login(form) {
    if (!form.email || !form.password ||
        form.email.trim() === '' ||
        form.password.trim() === '') {
        this.alertMessage = 'Invalid Login.';
        this.loginUser.password = '';
        return;
    }
    const load = await this.load.create({ message: 'Logging in...' });
    load.present();

    const User = await this.auth.login(form);
    if (!User.user) {
      this.alertMessage = User;
      load.dismiss();
      this.loginUser.password = '';
      return;
    }
    load.dismiss();

    // this.router.navigate(['/tabs/tabaccount']);
  }

  register() {
    this.router.navigate(['/tabs/tabaccount/register']);
  }

  resetPwd() {
    this.router.navigate(['/tabs/tabaccount/resetpassword']);
  }
}
