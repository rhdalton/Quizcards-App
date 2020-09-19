import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { AppdataClass } from 'src/app/shared/classes/appdata';

@Component({
  selector: 'quizcards-qcgroups',
  templateUrl: './qcgroups.component.html',
  styleUrls: ['./qcgroups.component.scss'],
})
export class QcgroupsComponent implements OnInit {
  _userSub: Subscription;
  _loader;
  _limits;
  _isPro: boolean;
  User: User;

  constructor(
    private auth: AuthService,
    private alert: AlertController,
    private load: LoadingController,
    private router: Router,
    private app: AppdataClass
  ) { }

  async ngOnInit() {
    this._loader = await this.load.create({ message: 'Loading your QuizCard groups...' });

    this._userSub = this.auth.appUser$.subscribe(async (appUser) => {
      if (!appUser) {

        this.User = null;
        this._loader.dismiss();

        // check to make sure user logged in
        this.alert.create({
          header: 'Login Required',
          message: 'Please log in access QuizCard Groups.',
          buttons: ['OK']
        }).then(a => a.present());

        this.router.navigate(['/tabs/tabaccount']);

      } else {

        this.User = appUser;
        this._limits = this.app.appLimits(this.User.userStatus);
        this._isPro = this.app.isPro(this.User.userStatus);

      }
    });
  }

}
