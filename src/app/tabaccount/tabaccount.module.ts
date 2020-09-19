import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ResetpasswordComponent } from './components/resetpassword/resetpassword.component';
import { UpgradeproComponent } from './components/upgradepro/upgradepro.component';
import { UsercloudComponent } from './components/usercloud/usercloud.component';
import { TabaccountPage } from './tabaccount.page';
import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2/ngx';
import { BadgesComponent } from './components/badges/badges.component';
import { Achievements } from '../shared/classes/achievements';
import { AchievemodalComponent } from './components/achievemodal/achievemodal.component';
import { QcgroupsComponent } from './components/qcgroups/qcgroups.component';

const routes: Routes = [
  { path: '', component: TabaccountPage },
  { path: 'register', component: RegisterComponent },
  { path: 'resetpassword', component: ResetpasswordComponent },
  { path: 'usercloud/:backupid', component: UsercloudComponent },
  { path: 'usercloud', component: UsercloudComponent },
  { path: 'upgradepro', component: UpgradeproComponent },
  { path: 'badges', component: BadgesComponent },
  { path: 'qcgroups', component: QcgroupsComponent }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  entryComponents: [
    AchievemodalComponent
  ],
  declarations: [
    TabaccountPage,
    LoginComponent,
    RegisterComponent,
    ResetpasswordComponent,
    UsercloudComponent,
    UpgradeproComponent,
    BadgesComponent,
    AchievemodalComponent,
    QcgroupsComponent
  ],
  providers: [
    InAppPurchase2
  ]
})
export class TabaccountPageModule {}
