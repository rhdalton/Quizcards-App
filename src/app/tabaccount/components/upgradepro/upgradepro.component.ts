import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from 'src/app/models/user';
import { Subscription } from 'rxjs';
import { AppSettings } from 'src/app/models/appsettings';
import { AppdataClass } from 'src/app/shared/classes/appdata';
import { AuthService } from 'src/app/services/auth.service';
import { Platform, AlertController } from '@ionic/angular';
import { InAppPurchase2, IAPProduct } from '@ionic-native/in-app-purchase-2/ngx';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Router } from '@angular/router';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { WebstorageService } from 'src/app/services/webstorage.service';

@Component({
  selector: 'app-upgradepro',
  templateUrl: './upgradepro.component.html',
  styleUrls: ['./upgradepro.component.scss'],
})
export class UpgradeproComponent implements OnInit, OnDestroy {
  User: User;
  isPro = false;
  _pageLoaded = false;
  _userSub: Subscription;
  _app: AppSettings;
  _productId: string;
  Product: IAPProduct;
  productReady = false;

  constructor(
    private app: AppdataClass,
    private auth: AuthService,
    private platform: Platform,
    private store: InAppPurchase2,
    private firestore: FirestoreService,
    private webstorage: WebstorageService,
    private alert: AlertController,
    private router: Router,
    private toast: ToastNotification
  ) {
    this._pageLoaded = false;
    this._productId = "quizcards.edition.pro";
  }

  ngOnInit() {
    this._userSub = this.auth.appUser$.subscribe(appUser => {
      if (!appUser) {
        this.User = null;
      } else {
        this.User = appUser;
        this.isPro = this.app.isPro(this.User.userStatus);
      }
      this._pageLoaded = true;
    });

    if (this.platform.is('cordova')) {
      this.configurePurchase();
    }
  }

  ngOnDestroy() {
    this._userSub.unsubscribe();
  }

  configurePurchase() {

    this.store.verbosity = this.store.DEBUG;

    this.store.register({
      id: this._productId,
      alias: "Pro Account",
      type: this.store.CONSUMABLE
    });

    // Handlers
    this.store.when(this._productId).approved((product: IAPProduct) => {
      // Purchase was approved
      this.firestore.upgradeUserToPro(this.User, product);
      this.alert.create({
        header: "Upgrade Success",
        message: "Purchase successful. Your account has now been upgraded to QuizCards Pro! You can start taking advantage of the benfits now.",
        buttons: ['OK']
      }).then(a => a.present());
      product.finish();
      this.router.navigateByUrl('/tabs/tabaccount');
    });

    this.store.when(this._productId).registered((product: IAPProduct) => {
      // this.toast.loadToast('Registered: ' + product.title);
      // this.product = product;
    });

    this.store.when(this._productId).updated((product: IAPProduct) => {
      // this.toast.loadToast('Updated ' + product.title);
      this.Product = product;
      this.getProductPrice();
    });

    this.store.when(this._productId).cancelled( (product) => {
      this.toast.loadToast('purchase cancelled');
    });

    this.store.error((err) => {
      this.alert.create({
        header: 'Error',
        message: 'There was an error setting up App purchases. Make sure you are logged into your Google Play account.',
        buttons: ['OK']
      }).then(a => a.present());
    });

    // Errors
    this.store.when(this._productId).error( (error) => {
      this.toast.loadToast('Error with Pro Upgrade purchase');
    });

    this.store.ready(async (products) => {
      // this.toast.loadToast('Ready: ' + product);
      // console.log('Products: ' + JSON.stringify(this.store.products));
      this.Product = this.store.get(this._productId);
      this.getProductPrice();
    });

    // Refresh Always
    this.store.refresh();
  }

  async getProductPrice() {
    if (this.Product.price) {
      this.webstorage.setProUpgradePrice({ price: this.Product.price, currency: this.Product.currency });
    } else {
      const stored_product = await this.webstorage.getProUpgradePrice();
      this.Product.price = stored_product.price;
      this.Product.currency = stored_product.currency;
      // this.toast.loadToast('Is storage product', 10);
    }
    this.productReady = true;
  }

  doUpgrade() {
    console.log('upgrade');
    if (!this.platform.is('cordova')) return;
    this.store.order(this._productId).then(() => {
      // this.toast.loadToast('ordering window open..');
    })
    .catch(e => {
      this.alert.create({
        header: "Error",
        message: "Sorry, there was an error with your purchase. Try again, or contact me at quizcardsapps@gmail.com",
        buttons: ['OK']
      }).then(a => a.present());
    });
  }
}
