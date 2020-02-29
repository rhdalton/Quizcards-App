import { Component, OnInit } from '@angular/core';
import { NavParams, Platform } from '@ionic/angular';
import { File } from '@ionic-native/File/ngx';

@Component({
  selector: 'quizcards-audiolist',
  templateUrl: './audiolist.component.html',
  styleUrls: ['./audiolist.component.scss'],
})
export class AudiolistComponent implements OnInit {
  modal;
  loader;
  audioList;
  excludeDir = ['.', '..', 'Android'];
  searching = true;

  constructor(
    private param: NavParams,
    private platform: Platform,
    private File: File
  ) {
    this.modal = this.param.get('modal');
    this.loader = this.param.get('loader');
    this.audioList = [];
  }

  ngOnInit() {
    this.platform.ready().then(async () => {
      const result = await this.File.listDir(this.File.externalRootDirectory, '');

      for (let item of result) {
        if (!this.searching) {
          console.log('end search primary');
          break;
        }
        if (item.isDirectory == true && !this.excludeDir.includes(item.name)) {
          this.getFileList(item.name);
        }
        else if (item.isFile === true) {
          let extn = item.fullPath.split(".").pop();
          if (extn === 'mp3') {
            this.saveToAudioList(item);
          }
        }
      }
      
      // this.searching = false;
    });
  }

  async getFileList(path) {
    if (!this.searching) {
      console.log('end search outtree');
      return false;
    }
    const result = await this.File.listDir(this.File.externalRootDirectory, path);
    for (let item of result) {   
      if (!this.searching) {
        console.log('end search intree');
        return false;
      }   
      if (item.isDirectory == true && !this.excludeDir.includes(item.name)) {
        this.getFileList(path + '/' + item.name);
      }
      else if (item.isFile === true) {
        let extn = item.fullPath.split(".").pop();
        if (extn === 'mp3') {
          this.saveToAudioList(item);
        }
      }
    }
  }

  saveToAudioList(item) {
    this.audioList.push({
      name: item.name,
      fullPath: item.fullPath
    });
  }

  addAudio(audio) {
    console.log('add audio', audio);
    this.loader.present();
    this.searching = false;
    this.modal.dismiss(audio);
  }

  close() {
    this.searching = false;
    this.modal.dismiss();
  }
}
