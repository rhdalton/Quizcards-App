import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { AchievealertComponent } from './components/achievealert/achievealert.component';

@NgModule({
  declarations: [
    AchievealertComponent
  ],
  entryComponents: [
    AchievealertComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ],
  exports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class SharedModule { }
