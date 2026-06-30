import {
  ApplicationConfig,
  EnvironmentProviders,
  Provider,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { ReCaptchaV3Provider } from 'firebase/app-check';
import { firebaseConfig, appCheckSiteKey } from '../environment';

// Authentication is handled locally (see core/auth-config.ts) because Firebase Auth
// can't be enabled without project-owner access. Only Database (+ optional App Check)
// are provided here.
const providers: Array<Provider | EnvironmentProviders> = [
  provideBrowserGlobalErrorListeners(),
  provideZonelessChangeDetection(),
  provideRouter(routes),
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideDatabase(() => getDatabase()),
];

// Firebase App Check (optional): enabled only when a reCAPTCHA v3 site key is set.
if (appCheckSiteKey) {
  providers.push(
    provideAppCheck(() =>
      initializeAppCheck(getApp(), {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      }),
    ),
  );
}

export const appConfig: ApplicationConfig = { providers };
