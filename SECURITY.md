# El7a2ny — Security & sign-in

You are **not the owner** of the Firebase project, so you can't enable any Firebase
Authentication provider (Email/Password, Google, Apple, Anonymous — they all need console
access). Because of that, the app ships with a **self-contained local login gate** instead of
Firebase Auth. This page explains how it works, how to manage it, and how to upgrade to real
Firebase Auth later when you have owner access.

---

## 1. Sign-in (local — no Firebase, no console access needed)

Login is validated **in the browser** against a small operator list in
`src/app/core/auth-config.ts`. Passwords are stored as **SHA-256 hashes** (not plaintext), and a
lightweight session is kept in `localStorage`.

**Working credentials** (same as the original app):

| Email | Password |
|---|---|
| `manager@el7a2ny.com` | `SX2GXscW949eG6Fu` |
| `ahmed@el7a2ny.com` | `Kyv467VYxfQ5mwJ8` |
| `ismail@el7a2ny.com` | `Hq91azZSk7TBLmzv` |
| `ahmedasemelfert@gmail.com` | `vSY88s0fPe8UngU5` |

**Add or change an operator** — generate a hash and add it to `OPERATORS`:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
```

**Turn the login off entirely** (open app, no sign-in): set `AUTH_BYPASS = true` in
`src/app/core/auth-config.ts`.

> ⚠️ This is a convenience gate, not strong security — the password hashes ship in the bundle.
> It matches the protection level of the original app. Real security needs Firebase Auth + DB
> rules (section 4), which require owner access.

---

## 2. Why third-party / anonymous sign-in won't help right now

Google, Apple, GitHub, phone, and anonymous sign-in are all **Firebase Auth providers** — each
must be switched on in **Authentication → Sign-in method**, which needs owner/editor access.
There is no third-party login that works without enabling it in the console, so the local gate
above is the correct workaround until you get access.

---

## 3. Database rules — do NOT lock to `auth` yet

`database.rules.json` contains the **target** rules (`auth != null`). **Don't deploy them while
the app uses local auth** — the app has no Firebase auth token, so auth-required rules would
block every read and write and the dashboard would show no data.

- **Now (local auth):** the database stays as the project owner currently has it. You can't
  change rules without owner access anyway.
- **Later (with owner access + Firebase Auth):** deploy the rules — `firebase deploy --only database`
  — and remember the customer mobile app must also authenticate.

---

## 4. Upgrade path → real Firebase Auth (when you get owner access)

1. Owner enables **Authentication → Email/Password** and creates the operator users.
2. Re-add `provideAuth(() => getAuth())` to `app.config.ts` (import from `@angular/fire/auth`).
3. Swap the local `AuthService`/`authGuard` for the Firebase versions (email/password +
   `authState`) — this is a small, contained change in `core/services/auth.service.ts` and
   `core/guards/auth.guard.ts`.
4. Deploy `database.rules.json` and enable **App Check** (set `appCheckSiteKey` in
   `src/environment.ts`).

---

## 5. Passwords & keys (independent of owner access)

- **Passwords:** the dashboard never displays them and strips `password` from any record it
  copies (archive / restore / VIP) — `RecordsService.sanitize()`. A one-time Admin-SDK cleanup
  of existing rows needs owner access (script below).
- **Maps:** the app uses keyless Leaflet + OpenStreetMap, so the old committed Google Maps key
  is no longer used and can be removed/restricted.

```js
// node cleanup-passwords.js — requires a service-account key (owner access)
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
  databaseURL: 'https://el7a2ny-b70c7-default-rtdb.firebaseio.com',
});
const db = admin.database();
const nodes = ['users','vip','emergency','maintaince_Request','carEditRequest',
  'deletedUsers','deletedEmergencyUsers','deletedMaintainceRequestUsers','deletedCarEditRequestUsers'];
(async () => {
  for (const node of nodes) {
    const snap = await db.ref(node).get();
    snap.forEach((c) => {
      db.ref(`${node}/${c.key}/password`).remove();
      db.ref(`${node}/${c.key}/user/password`).remove();
    });
  }
  console.log('done'); process.exit(0);
})();
```
