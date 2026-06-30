# Background push (Firebase Cloud Messaging)

The dashboard already shows **in‑app realtime alerts** (toast + sound) while a tab is open.
This adds **web push** so operators are alerted even when the tab is **backgrounded or closed**.

It's **off by default** and the app runs normally without it — it activates only once a VAPID key
is set and the Cloud Function is deployed (both need Firebase owner access).

## How it works

| Piece | File | Role |
|---|---|---|
| Service worker | `public/firebase-messaging-sw.js` | Receives pushes in the background and shows the OS notification (data‑only → full control) |
| Client | `src/app/core/services/messaging.service.ts` | Registers the SW (relative to `<base href>`), asks permission, gets the device token, stores it under `fcmTokens/` |
| Server | `functions/index.js` (`onNewEmergency`) | On a new `/emergency/{id}`, fans out a push to every token in `fcmTokens/`, pruning dead ones |
| Config | `src/environment.ts` → `fcmVapidKey` | Empty = disabled. Set it to enable. |

## Enable it (owner, one‑time)

1. **Generate a Web Push key.** Firebase console → **Project settings → Cloud Messaging →
   Web configuration → Web Push certificates → Generate key pair.** Copy the public key.
2. **Set it in the app:** `src/environment.ts`
   ```ts
   export const fcmVapidKey: string = 'BModule...your-key...';
   ```
3. **Install function deps & deploy** (Cloud Functions require the **Blaze** plan):
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only functions,hosting
   ```
   (`hosting` ships the service worker; `functions` deploys the push trigger.)
4. Reload the app — operators get a one‑time permission prompt. Granting stores their device
   token. New emergencies then push to every device, even with the tab closed.

## Notes

- **HTTPS required.** Firebase Hosting and GitHub Pages are both HTTPS; `localhost` works for dev.
- **Sub‑path hosting (GitHub Pages `/REPO/`)** is handled: the SW registers relative to
  `document.baseURI` and builds its icon/link URLs from its own `scope`, so it works at domain
  root and under a sub‑path.
- **Security:** the Cloud Function runs with admin rights, so it works regardless of database
  rules. With rules locked (see `SECURITY.md`), clients still need write access to `fcmTokens/`
  to register — keep a rule allowing authenticated writes there.
- **iOS:** web push requires iOS 16.4+ and the site **added to the Home Screen**.
- Foreground messages are intentionally ignored by the client (the realtime `NotificationService`
  already handles in‑app alerts), so you won't get double notifications.
