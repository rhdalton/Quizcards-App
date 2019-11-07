import { Component, OnInit } from '@angular/core';
import { File } from '@ionic-native/File/ngx';

@Component({
  selector: 'quizcards-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
})
export class ImportComponent implements OnInit {
  backups = [];

  constructor(private File: File) { }

  ngOnInit() {
    this.loadBackups('');
  }

  async loadBackups(dir) {    
    await this.File.listDir(this.File.externalRootDirectory, dir)
      .then(entries => {

        for(let i = 0; i < entries.length; i++) {
          if(!entries[i]['isDirectory']) {
            const qcs_index = entries[i]['fullPath'].lastIndexOf('.qcs');
            if(qcs_index > -1 && qcs_index + 4 === entries[i]['fullPath'].length) {
              this.backups.push(entries[i]);
            }
          } else {
            // var children_data = await this.listDirHelper(entries[i]['nativeURL'],entries[i]['name']);
            // if(children_data !== false){
            //   current_folder['children'].push(children_data);
            // }
          }
        }
      })
      .catch((err) => {
          console.log('error in listing directory', err);
      });
  }

  restoreBackup(b) {
    
  }
}
