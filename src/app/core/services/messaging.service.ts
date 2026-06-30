import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

import { DataService } from '../../shared/services/data.service';
import { fcmVapidKey } from '../../../environment';

/**
 * Firebase Cloud Messaging (web push) client.
 *
 * Registers the background service worker, obtains the device token, and stores
 * it under `fcmTokens` so a Cloud Function can fan out pushes when a new
 * emergency is created — delivering alerts even when the tab is closed.
 *
 * Entirely no-op unless `fcmVapidKey` is set (see environment.ts / FCM_PUSH.md),
 * so the app is unaffected until background push is configured by the owner.
 * Foreground alerts are handled by the realtime NotificationService, so this
 * service intentionally does not toast on foreground messages (avoids dupes).
 */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly data = inject(DataService);
  private started = false;

  async init(): Promise<void> {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    if (!fcmVapidKey) return; // background push not configured — skip cleanly
    this.started = true;

    try {
      if (!(await isSupported())) return;
      if (!('serviceWorker' in navigator) || !('Notification' in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // Resolve against the app's <base href> so it works at domain root (Firebase
      // Hosting) and under a sub-path (GitHub Pages project sites: /REPO/).
      const swUrl = new URL('firebase-messaging-sw.js', document.baseURI).toString();
      const registration = await navigator.serviceWorker.register(swUrl);
      const messaging = getMessaging(getApp());
      const token = await getToken(messaging, {
        vapidKey: fcmVapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        // RTDB keys can't contain . # $ / [ ] — sanitize; keep the real token as a field.
        const key = token.replace(/[.#$/[\]]/g, '_');
        await this.data.set(`fcmTokens/${key}`, {
          token,
          ts: Date.now(),
          ua: navigator.userAgent.slice(0, 140),
        });
      }

      // Foreground delivery is covered by NotificationService; no toast here.
      onMessage(messaging, () => undefined);
    } catch {
      /* push unavailable / blocked — app continues with in-app realtime alerts */
    }
  }
}
