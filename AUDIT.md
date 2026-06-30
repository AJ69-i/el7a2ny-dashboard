# El7a2ny Dashboard — Security & Quality Audit

Review across **Security, UI states, Exposed secrets, Error handling, and Deployment gaps**.
Items are rated **Critical / High / Medium / Low** and tagged ✅ fixed this pass · ⚠️ mitigated ·
❗ open (needs owner/infra access).

## Summary

| Area | Status |
|---|---|
| Security | ❗ 1 critical (open database) + auth currently bypassed — owner action required |
| Exposed secrets | ⚠️ Firebase config public by design; risk is the open DB, not the keys |
| UI states (loading/error/success/empty) | ✅ Added loading, error, success (toasts); empty already present |
| Error handling | ✅ Reads + writes now catch errors and surface feedback |
| Deployment gaps | ⚠️ Several pre‑go‑live items (rules, hosting config, tests) |

---

## 1. Security

**❗ Critical — the Realtime Database is currently open.** The live rules allow public
read/write (the original app shipped that way). The export confirms it exposes customer PII —
names, phones, plate numbers, VIN, GPS coordinates, and bcrypt password hashes. Anyone with the
public Firebase URL can read, modify, or delete everything.
→ **Action (owner only):** deploy the locked rules in `database.rules.json`
(`firebase deploy --only database`) and enable App Check. See `SECURITY.md §3‑4`. This is the #1
risk and the single most important thing to do before any real use.

**⚠️ High — authentication is currently bypassed.** `AUTH_BYPASS = true`
(`src/app/core/auth-config.ts`) opens the app with no sign‑in (your interim workaround while the
owner can't enable Firebase Auth). → **Action:** set it to `false` and move to Firebase Auth
before exposing the app publicly.

**⚠️ Medium — interim local login is not real security.** Operator passwords are unsalted
SHA‑256 hashes shipped in the bundle. Fine as a temporary gate (the passwords are random), but
replace with Firebase Auth when possible (`SECURITY.md §4`).

**✅ Fixed — coordinate injection.** `lat`/`lng` are now coerced to finite numbers in
`RecordsService.normalize()` before they're interpolated into the (sanitizer‑bypassed) OpenStreetMap
iframe URL — previously an attacker‑written string in the open DB could have tampered with that URL.

**✅ OK — XSS surface reviewed.** Leaflet map popups escape user fields (`escapeHtml`); the icon
component's `bypassSecurityTrustHtml` only renders a fixed internal SVG set (no user input); all
table/detail text uses Angular interpolation (auto‑escaped).

**⚠️ Low — session flag is forgeable.** The bypass/local session is a `localStorage` value; only
relevant once a real auth gate is enabled.

## 2. Exposed secrets

- **Firebase web config** (`apiKey`, `databaseURL`) in `src/environment.ts` is **public by design**
  for web Firebase — it's not a true secret. The exposure that matters is the **open DB rules**
  (see §1). Lock the rules + App Check and the public config is fine.
- **✅ Google Maps API key removed.** The original app committed a Maps key in `app.module.ts`; the
  rewrite uses **keyless Leaflet + OpenStreetMap**, so there's no Maps key to leak.
- **⚠️ Operator password hashes** live in `auth-config.ts` (client bundle). Low risk, but delete
  them when you switch to Firebase Auth.
- **⚠️ Customer passwords** (bcrypt) exist in the DB and are returned to the client. The dashboard
  never displays them and strips them on archive (`RecordsService.sanitize()`), but the open DB
  still exposes them. Ideally stop storing passwords in RTDB altogether.
- No `.env` / multi‑env split. For staging vs prod, add `environment.prod.ts`.

## 3. UI states

- **✅ Loading.** Added `LoadingComponent` (spinner). `RecordsService` now tracks a per‑node
  `loading` signal; the generic list pages and the Emergency page show "Loading…" instead of a
  misleading "No records found" during the first fetch.
- **✅ Error.** `RecordsService` now `catchError`s read failures and the list shows an error state;
  `EmergencyService` already did. Write failures now show an error toast.
- **✅ Success.** New `ToastService` + toast container. Success toasts on: dispatch status change,
  done / restore / add‑VIP / remove, and offline‑days add / remove / clear.
- **✅ Empty.** List, map, offline‑days, and customer‑profile already have empty states — now
  visually distinct from loading.
- **⚠️ Minor (open).** Dashboard KPIs/charts flash `0` for a moment during the initial load (no
  skeleton). Low priority; can add skeletons later.

## 4. Error handling

- **✅ Global:** `provideBrowserGlobalErrorListeners()` is registered (catches uncaught errors).
- **✅ Reads:** all generic collections now capture errors (no more silent empty on permission
  failure).
- **✅ Writes:** dispatch, done/restore/VIP/remove, and offline‑days writes are wrapped in
  try/catch with success/error toasts. (Writes are optimistic — the UI updates from the live
  stream — so once rules are enforced, a denied write surfaces a clear error.)
- **✅ Resilience:** Leaflet load failure → graceful fallback list; login shows friendly errors.

## 5. Deployment gaps

- **❗ Do not deploy publicly as‑is** — `AUTH_BYPASS=true` + open DB. Enable auth and lock rules first.
- **⚠️ Hosting config missing.** `firebase.json` only has database rules. If deploying to Firebase
  Hosting, add a hosting block with the Angular build output and an SPA rewrite, e.g.:
  ```json
  "hosting": { "public": "dist/el7a2ny-dashboard/browser",
    "ignore": ["firebase.json","**/.*","**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }] }
  ```
- **⚠️ Install/upgrade.** `package.json` targets Angular 21 but `node_modules` is still v20 — run
  `npm install` (use `--legacy-peer-deps` for `@angular/fire`).
- **⚠️ SSR.** Render mode is `Client` (CSR), which is correct for this realtime app; the Express
  `server.ts` build is effectively unused — you can drop `@angular/ssr` to slim the build if you
  never need SSR.
- **⚠️ Tests.** The scaffold specs (`app.spec.ts`, `data.service.spec.ts`, and the old
  `emergency.component.spec.ts`) aren't maintained and will fail under `ng test` (they lack Firebase
  TestBed providers). Update/remove them and add real tests.
- **⚠️ Dead code.** `src/app/emergency/` is the unused original scaffold (unrouted, contains a
  leftover `console.log` + Notification demo). It's tree‑shaken out of the build, but please delete
  the folder (file deletion wasn't possible from this tool).
- **⚠️ Runtime CDN dependency.** Leaflet loads from cdnjs at runtime; for fully offline/self‑hosted
  deploys, bundle `leaflet` locally instead.
- **Optional:** add error monitoring (e.g. Sentry) for production.

---

## Go‑live checklist

1. Owner: enable **Email/Password** auth + create operator accounts.
2. Set `AUTH_BYPASS = false`; switch to Firebase Auth (`SECURITY.md §4`).
3. Deploy **locked** `database.rules.json`; ensure the customer app authenticates.
4. Enable **App Check** (set `appCheckSiteKey`).
5. Run the one‑time **password cleanup** script (`SECURITY.md §5`).
6. Add the **hosting** block; `npm install --legacy-peer-deps`; `npm run build`; deploy.
7. Remove dead `src/app/emergency/`; fix or remove stale specs.
