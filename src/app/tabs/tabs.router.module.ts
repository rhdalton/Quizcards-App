import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { IonTabs } from '@ionic/angular';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: 'tabhome'
      },
      {
        path: 'tabhome',
        loadChildren: '../tabhome/tabhome.module#TabhomeModule'
      },
      {
        path: 'tabmanage',
        loadChildren: '../tabmanage/tabmanage.module#TabmanagePageModule'
      },
      {
        path: 'tabaccount',
        loadChildren: '../tabaccount/tabaccount.module#TabaccountPageModule'
      },
      {
        path: 'tabmore',
        loadChildren: '../tabmore/tabmore.module#TabmorePageModule'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/tabhome',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: [
    IonTabs
  ]
})
export class TabsPageRoutingModule {}
