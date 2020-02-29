import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { Card } from 'src/app/models/card';
import { Quiz } from 'src/app/models/quiz';
import { ToastNotification } from './toast';

@Injectable({
  providedIn: 'root'
})

export class PlayAudio {
  public audioActive;

  constructor(
    private platform: Platform,
    private tts: TextToSpeech,
    private toast: ToastNotification
  ) { }

  async playAudio(ms: Number, Card: Card, Quiz: Quiz = null) {
    await this.delay(ms);
    this.audioActive = true;
    await this.play(Card, Quiz);
    this.audioActive = false;
  }

  play(Card: Card, Quiz: Quiz) {
    return new Promise((res) => {
      if (Card.c_audio) {
        // this.audioCard.play();
        // this.audioCard.onended = res;
      } else
      if (Quiz.tts !== '' && this.platform.is('cordova')) {
        this.tts.speak({
          text: Card.c_text,
          locale: Quiz.tts,
          rate: Quiz.ttsSpeed / 100
        }).then(() => res())
        .catch(err => {
          this.toast.loadToast('Error playing audio. Check if TTS language correct.', 5);
        });
      } else {
        res();
      }
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}