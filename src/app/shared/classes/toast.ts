import { ToastController } from "@ionic/angular";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ToastNotification {

  constructor(private toastCtrl: ToastController) { }

  loadToast(msg, time = 2) {
    this.toastCtrl.create({
      message: msg,
      duration: time * 1000
    }).then(t => t.present());
  }
}
