import { Component, OnInit } from '@angular/core';
import { NavParams, Platform } from '@ionic/angular';
import { File } from '@ionic-native/File/ngx';
import { ToastNotification } from 'src/app/shared/classes/toast';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';

@Component({
  selector: 'quizcards-audiolist',
  templateUrl: './audiolist.component.html',
  styleUrls: ['./audiolist.component.scss'],
})
export class AudiolistComponent implements OnInit {
  modal;
  audioList;
  filteredAudio;
  includeDir = ['Download', 'Music'];
  excludeDir = ['.', '..'];
  validAudioExt = ['mp3', 'wav', 'ogg'];
  searching = true;
  searchItem = [];
  recurseDir = [];
  sdLocs = [];

  constructor(
    private param: NavParams,
    private platform: Platform,
    private file: File,
    private diagnostic: Diagnostic,
    private keyboard: Keyboard,
    private toast: ToastNotification
  ) {
    this.modal = this.param.get('modal');
    this.audioList = [];
    this.filteredAudio = [];
  }

  ngOnInit() {
    this.platform.ready().then(async () => {
      if (this.platform.is('cordova')) {

        let dir = await this.file.listDir(this.file.externalRootDirectory, '');
        for (const item of dir) {
          if (item.isDirectory && this.includeDir.includes(item.name)) {
            this.recurseDir.push(item.name);
          } else if (item.isFile) {
            this.checkExt(this.file.externalRootDirectory, item);
          }
        }

        while (this.recurseDir.length > 0) {
          dir = await this.file.listDir(this.file.externalRootDirectory, this.recurseDir[0]);
          for (const item of dir) {
            if (item.isDirectory && !this.excludeDir.includes(item.name)) {
              this.recurseDir.push(this.recurseDir[0] + '/' + item.name);
            } else if (item.isFile) {
              this.checkExt(this.file.externalRootDirectory, item);
            }
          }
          this.recurseDir.shift();
        }

        this.diagnostic.getExternalSdCardDetails()
          .then(async (details) => {
            details.forEach((detail) => {
              if (detail.type === 'root') {
                this.sdLocs.push(detail.filePath);
              }
            });
            for (let i = 0; i < this.sdLocs.length; i++) {
              for (let j = 0; j < this.includeDir.length; j++) {
                try {
                  const dirlist = await this.file.listDir(this.sdLocs[i], this.includeDir[j]);
                  for (const item of dirlist) {
                    if (item.isDirectory) {
                      this.recurseDir.push(this.includeDir[j] + '/' + item.name);
                    } else if (item.isFile) {
                      this.checkExt(this.sdLocs[i], item, true);
                    }
                  }
                  while (this.recurseDir.length > 0) {
                    dir = await this.file.listDir(this.sdLocs[i], this.recurseDir[0]);
                    for (const item of dir) {
                      if (item.isDirectory && !this.excludeDir.includes(item.name)) {
                        this.recurseDir.push(this.recurseDir[0] + '/' + item.name);
                      } else if (item.isFile) {
                        this.checkExt(this.sdLocs[i], item, true);
                      }
                    }
                    this.recurseDir.shift();
                  }
                } catch (e) {
                  console.log('no dir exist');
                }
              }
            }
            this.searching = false;
        });
      // } else {
      //   this.audioList.push({ name: 'Song number 1', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 2', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 3', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 4', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 5', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 6', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 7', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 8', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 9', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 10', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 11', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 12', relativePath: '/music' });
      //   this.audioList.push({ name: 'Song number 13', relativePath: '/music' });

      //   this.filteredAudio = this.audioList;
      //   this.searching = false;
      }
    });
  }

  checkExt(root, item, isSD = false) {
    const extn = item.fullPath.split(".").pop();
    if (this.validAudioExt.includes(extn)) {
      this.saveToAudioList(root, item, isSD);
    }
  }

  saveToAudioList(root, item, isSD) {
    const path = root.replace('file://', '');
    const relPath = item.fullPath.substr(0, item.fullPath.lastIndexOf('/')) + '/';
    this.audioList.push({
      name: item.name,
      relativePath: (isSD) ? relPath.replace(path, 'SD Card') : relPath,
      fullPath: (isSD) ? 'file://' + item.fullPath :  root + item.fullPath
    });

    this.filteredAudio = this.audioList;
  }

  addAudio(audio) {
    this.modal.dismiss(audio);
  }

  close() {
    this.searching = false;
    this.modal.dismiss();
  }

  filterAudio(term) {
    this.keyboard.hide();
    term = term.toLowerCase();
    if (term === '') {
      this.filteredAudio = this.audioList;
    } else {
      this.filteredAudio = this.audioList.filter((audio) => {
        return audio.name.toLowerCase().includes(term);
      });
    }
  }
}
