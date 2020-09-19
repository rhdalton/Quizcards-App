import { Storage } from '@ionic/storage';
import { AppSettings } from '../../models/appsettings';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class QuizClass {

  constructor() {
  }

  setFontSize(content: string, img: string) {
    if ((img && img !== '') || content.length > 100) return 'sm3';
    else if (content.length > 70) return 'sm2';
    else if (content.length > 40) return 'sm1';
    else return '';
  }

  setQcardSize(switchtext: number) {
    return (switchtext === 1) ? 'qcardswitch' : '';
  }
}
