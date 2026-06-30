/* Firebase Cloud Messaging background service worker.
 * Served at the app base (…/firebase-messaging-sw.js). Handles pushes when the
 * dashboard tab is backgrounded or fully closed. Uses the compat SDK (required
 * for importScripts in a worker). The Firebase web config below is public by
 * design. Messages are DATA-ONLY, so this worker fully controls display
 * (no double notifications) and builds asset/link URLs from its own scope, so
 * it works both at domain root and under a sub-path (e.g. GitHub Pages /REPO/). */
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDZ3d8csJYQNKulQDe47skh58JgMElUEEs',
  authDomain: 'el7a2ny-b70c7.firebaseapp.com',
  databaseURL: 'https://el7a2ny-b70c7-default-rtdb.firebaseio.com',
  projectId: 'el7a2ny-b70c7',
  storageBucket: 'el7a2ny-b70c7.firebasestorage.app',
  messagingSenderId: '560346665774',
  appId: '1:560346665774:web:c8734aa10e7f3d8c4ee0bf',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const scope = self.registration.scope; // ends with "/"
  self.registration.showNotification(d.title || 'El7a2ny', {
    body: d.body || 'New request',
    icon: scope + 'logo.webp',
    badge: scope + 'logo.webp',
    tag: d.kind || 'el7a2ny',
    data: d,
    requireInteraction: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const scope = self.registration.scope;
  const d = event.notification.data || {};
  const target = scope + (d.kind === 'emergency' ? 'emergency' : 'dashboard');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.startsWith(scope) && 'focus' in w) return w.focus();
      }
      return clients.openWindow(target);
    }),
  );
});
