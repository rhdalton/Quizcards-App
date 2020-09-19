import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { AlertController, Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  onlineStatus = false;

  constructor(
    private _net: Network,
    private alert: AlertController,
    private platform: Platform) {}

  isOnline() {
    if (this.platform.is('cordova')) {
      const connection = this._net.type;
      if (!connection || connection === 'unknown' || connection === 'none') {
        console.log('offline');
        return false;
      }
    }
    return true;
  }

  alertOffline(msg) {
    this.alert.create({
      header: "Network Conneciton",
      message: "An internet connection is required to " + msg + ". If you can't access this page, please check your network connection.",
      buttons: ['OK']
    }).then(a => a.present());
  }
}
