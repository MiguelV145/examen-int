import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

 const firebaseConfig ={
  apiKey: "AIzaSyAsDBb2Qlbt935PwqKdCVnt8e1O_vrckXI",
  authDomain: "examen-int.firebaseapp.com",
  projectId: "examen-int",
  storageBucket: "examen-int.firebasestorage.app",
  messagingSenderId: "457073292314",
  appId: "1:457073292314:web:c004a14e6da9ddae620da3",
  measurementId: "G-S4MJRX8NGV"
 };
export const appConfig: ApplicationConfig = {

 

  providers: [
    
     provideRouter(routes),
    provideHttpClient(withFetch()), // habilita HttpClient usando la API Fetch
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    })
  ],
};



