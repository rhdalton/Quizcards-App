import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { Camera } from '@ionic-native/Camera/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/File/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';
import { Network } from '@ionic-native/network/ngx';
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { Achievements } from './shared/classes/achievements';
import { AchievealertComponent } from './shared/components/achievealert/achievealert.component';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { ServiceWorkerModule } from '@angular/service-worker';
import { Media } from '@ionic-native/media/ngx';

export class CustomHammerConfig extends HammerGestureConfig  {
  overrides = {
      'pinch': { enable: false },
      'rotate': { enable: false }
  } as any;
}

@NgModule({
  declarations: [
    AppComponent
  ],
  entryComponents: [
  ],
  imports: [
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot({animated: false}),
    IonicStorageModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireStorageModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SQLite,
    { provide: FirestoreSettingsToken, useValue: {} },
    Camera,
    File,
    FilePath,
    FileTransfer,
    WebView,
    Achievements,
    Network,
    TextToSpeech,
    { provide: HAMMER_GESTURE_CONFIG, useClass: CustomHammerConfig },
    Media
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
