import { Injectable } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { Card } from 'src/app/models/card';
import { Quiz } from 'src/app/models/quiz';
import { ToastNotification } from './toast';
import { Media, MediaObject } from '@ionic-native/media/ngx';
import { File } from '@ionic-native/File/ngx';

@Injectable({
  providedIn: 'root'
})

export class PlayAudio {
  public audioActive;
  public audioStarted = false;
  private audio: MediaObject;

  constructor(
    private platform: Platform,
    private tts: TextToSpeech,
    private toast: ToastNotification,
    private media: Media,
    private file: File,
    private alert: AlertController
  ) { }

  async playAudio(ms: number, card: Card, quiz: Quiz = null) {
    if (this.audioStarted) {
      if (this.audioActive) {
        this.audio.pause();
        this.audioActive = false;
      } else {
        this.audio.play();
        this.audioActive = true;
      }
    } else {
      if (card.c_audio) {
        this.file.resolveLocalFilesystemUrl(card.audio_path)
          .then(success => {
            this.audio = this.media.create(card.audio_path);
            this.audioStarted = true;
            this.doPlay(ms, card, quiz);
          })
          .catch(err => {
          if (err.message === 'NOT_FOUND_ERR') {
            this.alert.create({
              header: 'Cannot Find Audio',
              message: 'The audio file <em>"' + card.c_audio + '"</em> no longer exists at the location when created. Edit this card and update the audio file location.',
              buttons: [
                { text: 'Ok' }
              ]
            }).then(a => a.present());
          } else {
            this.alert.create({
              header: 'Audio Error',
              message: 'There was an error playing the file <em>"' + card.c_audio + '"</em>. Edit this card and update with a valid audio file.',
              buttons: [
                { text: 'Ok' }
              ]
            }).then(a => a.present());
          }
          return;
        });
      } else {
        this.doPlay(ms, card, quiz);
      }
    }
  }

  async doPlay(ms, card, quiz) {
    await this.delay(ms);
    this.audioActive = true;
    await this.play(card, quiz);
    this.audioActive = false;
  }

  endAudio() {
    if (this.audioStarted) {
      this.audio.stop();
    }
    this.audioActive = false;
    this.audioStarted = false;
  }

  play(card: Card, quiz: Quiz) {
    return new Promise((res) => {
      if (card.c_audio) {
        this.audio.play();
        this.audio.onStatusUpdate.subscribe(status => {
          if (status.toString() === "4") {
            res();
          }
        });
      } else
      if (quiz.tts !== '' && this.platform.is('cordova')) {
        this.tts.speak({
          text: card.c_text,
          locale: quiz.tts,
          rate: quiz.ttsSpeed / 100
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
