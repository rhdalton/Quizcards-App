import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-resetpassword',
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss'],
})
export class ResetpasswordComponent implements OnInit {
  alertMessage = '';
  resetUser: any = {};

  constructor(
    private auth: AuthService
  ) {
    this.resetUser.email = '';
  }

  ngOnInit() {}

  async resetPassword(form) {
    // console.log(email.email);
    if (this.validateEmail(form.email.trim())) {
      const result = await this.auth.resetPassword(form.email.trim());
      if (result === 'success') {
        this.alertMessage = 'A password reset link has been sent to your email.';
        this.resetUser.email = '';
      } else this.alertMessage = 'This Email was not found.';
    } else {
      this.alertMessage = 'Invalid Email address';
    }
  }

  validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
}
