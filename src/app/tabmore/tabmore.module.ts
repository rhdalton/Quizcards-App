import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TabmorePage } from './tabmore.page';
import { ShareComponent } from './components/share/share.component';
import { SharecodeComponent } from './components/sharecode/sharecode.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AboutComponent } from './components/about/about.component';
import { RestoreComponent } from './components/restore/restore.component';
import { SharedModule } from '../shared/shared.module';
import { CommunityComponent } from './components/community/community.component';
import { ComHomeComponent } from './components/com-home/com-home.component';
import { ComUploadComponent } from './components/com-upload/com-upload.component';
import { ComFavoritesComponent } from './components/com-favorites/com-favorites.component';
import { ComDownloadComponent } from './components/com-download/com-download.component';
import { ComUploadmodalComponent } from './components/com-uploadmodal/com-uploadmodal.component';
import { Networkcategories } from '../shared/classes/networkcategories';
import { ImportComponent } from './components/import/import.component';

const routes: Routes = [
  { path: '', component: TabmorePage },
  { path: 'share/:quizid', component: ShareComponent },
  { path: 'sharecode', component: SharecodeComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'restore', component: RestoreComponent },
  { path: 'community', component: CommunityComponent },
  { path: 'import', component: ImportComponent}
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    TabmorePage,
    ShareComponent,
    SharecodeComponent,
    SettingsComponent,
    AboutComponent,
    RestoreComponent,
    CommunityComponent,
    ImportComponent,
    ComHomeComponent,
    ComUploadComponent,
    ComFavoritesComponent,
    ComDownloadComponent,
    ComUploadmodalComponent
  ],
  entryComponents: [
    ComDownloadComponent,
    ComUploadmodalComponent
  ],
  providers: [
    Networkcategories
  ]
})
export class TabmorePageModule {}
