import { Injectable } from '@angular/core';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/Camera/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/File/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Platform, AlertController } from '@ionic/angular';
import * as firebase from 'firebase/app';
import { Card } from 'src/app/models/card';

import { ToastNotification } from '../shared/classes/toast';

@Injectable({
  providedIn: 'root'
})

export class ImageService {
  fileTransfer: FileTransferObject;

  constructor(
    private camera: Camera,
    private platform: Platform,
    private file: File,
    private filePath: FilePath,
    private transfer: FileTransfer,
    private webview: WebView,
    private toast: ToastNotification,
    private alert: AlertController
  ) { }

  async takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 80,
      sourceType: sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true,
      targetHeight: 500,
      targetWidth: 500
    };

    let newFile = {
      c_image: '',
      image_path: ''
    };

    const imgPath = await this.camera.getPicture(options)
      .catch(e => {
        this.toast.loadToast('E: ' + e.message);
        return;
      });

    if (this.platform.is('android') && sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {

      const filePath = await this.filePath.resolveNativePath('file://' + imgPath)
        .catch(e => {
          this.toast.loadToast('FP: ' + e.message);
          return;
        });

      if (filePath) {
        const correctPath = filePath.substr(0, filePath.lastIndexOf("/") + 1);
        let currentName = imgPath.substring(imgPath.lastIndexOf("/") + 1);
        if (currentName.indexOf('?') > 0) currentName = currentName.substring(0, currentName.indexOf('?'));
        newFile = await this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
      }
    } else {
      const correctPath = imgPath.substr(0, imgPath.lastIndexOf("/") + 1);
      const currentName = imgPath.substr(imgPath.lastIndexOf("/") + 1);
      newFile = await this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
    }
    return newFile;
  }

  async copyFileToLocalDir(imgPath, currentName, newFileName) {
    const fileEntry = await this.file.copyFile(imgPath, currentName, this.file.dataDirectory, newFileName)
      .catch(e => {
        // this.toast.loadToast('Error copy. ' + er);
        console.log(e.message + ',' + imgPath + ' - ' + currentName);
      });

    if (fileEntry) {
      const image_path = this.file.dataDirectory + newFileName;
      return {
        c_image: this.pathForImage(image_path),
        image_path: image_path
      };
    }
  }

  get storageRef() {
    return firebase.storage().ref();
  }

  async deleteImage(imagepath) {
    const path = imagepath.substr(0, imagepath.lastIndexOf('/') + 1);
    const name = imagepath.substr(imagepath.lastIndexOf('/') + 1);
    await this.file.removeFile(path, name)
      .catch(e => this.toast.loadToast(JSON.stringify(e)));
    this.toast.loadToast('Image removed.');
  }

  async downloadImagesFromCloudStorage(cloudId, Cards: Card[], base: string) {
    const storagepath = base + '/' + cloudId;
    for (let i = 0; i < Cards.length; i++) {

      if (Cards[i].c_image !== '') {
        const fn = Cards[i].image_path.substr(Cards[i].image_path.lastIndexOf('/') + 1);
        const imgUrl = await this.storageRef.child(storagepath + '/' + fn).getDownloadURL();
        const downloadedImage = await this.downloadFirebaseImageToDevice(imgUrl);
        // this.toast.loadToast(downloadedImage.c_image + '@' + downloadedImage.image_path, 15);
        Cards[i].c_image = downloadedImage.c_image;
        Cards[i].image_path = downloadedImage.image_path;
      }
    }
    return Cards;
  }

  async downloadFirebaseImageToDevice(url, fn = '') {
    return new Promise<any>((res, rej) => {
      let fullimage = this.file.dataDirectory + fn;
      if (fn === '') fullimage = this.file.dataDirectory + this.createFileName();
      this.transfer.create().download(url, fullimage, true)
        .then(entry => {
          res({
            c_image: this.pathForImage(entry.nativeURL),
            image_path: entry.nativeURL
          });
        })
        .catch((err) => {
          res({
            c_image: '',
            image_path: ''
          });
        });
    });
  }

  createFileName() {
    const d = new Date().getTime();
    return d + '.jpg';
  }

  pathForImage(img) {
    if (img === null) return '';
    else return this.webview.convertFileSrc(img);
  }
}
