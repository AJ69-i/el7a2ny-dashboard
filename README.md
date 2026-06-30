# El7a2ny — Rescue Operations Dashboard

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

> Replace `OWNER/REPO` above with your GitHub path (e.g. `aj69-i/el7a2ny-dashboard`) so the
> badge resolves.

Operator console for **El7a2ny — Emergency, Tuning & Car Services**: a roadside‑rescue dispatch
and customer‑management dashboard built on **Angular 21** (standalone components, signals,
zoneless) over **Firebase Realtime Database**.

## Features

- **Emergency dispatch** — live requests table, interactive map (Leaflet + OpenStreetMap, keyless),
  detail drawer with status write‑back.
- **Operations** — maintenance bookings, amendment (tuning) requests — each a filterable,
  paginated, exportable list.
- **Customers & VIP** — customer directory, VIP management, and a **Customer 360** profile that
  joins every request across modules by user ID.
- **Histories** — emergency / maintenance / amendment / users archives with restore.
- **Offline days** — block Home/Workshop days (single or range).
- **Analytics** — cross‑module KPIs and clickable charts that drill into filtered lists.
- **Global search** (⌘K), **CSV export**, **new‑request browser notifications**, light/dark theme.

## Quick start

```bash
npm install --legacy-peer-deps   # @angular/fire peer-dep; handled by .npmrc
npm start                        # dev server → http://localhost:4200
npm run build                    # production build → dist/el7a2ny-dashboard/browser
npm test                         # unit tests (watch)   ·   npm run test:ci  (headless)
```

**Sign‑in:** login is currently bypassed (`AUTH_BYPASS` in `src/app/core/auth-config.ts`) so the
app opens directly. To require sign‑in, set it to `false` — operator accounts are in the same file.

## Deployment

Static SPA on **Firebase Hosting** (config in `firebase.json`):

```bash
npm run build
firebase deploy --only hosting
```

CI (GitHub Actions, `.github/workflows/ci.yml`) builds + tests every push/PR and
**auto‑deploys to Hosting on pushes to `main`** — once the `FIREBASE_SERVICE_ACCOUNT` repo
secret is set (see the comment in the workflow).

## Documentation

| Doc | What's in it |
|---|---|
| `MIGRATION_PLAN.md` | Architecture, the original→Angular 21 rebuild, Firebase data model |
| `SECURITY.md` | Auth, database rules, App Check, password cleanup — pre‑production steps |
| `AUDIT.md` | Security / UI‑state / error‑handling / deployment review + go‑live checklist |
| `TESTING.md` | Test setup, patterns, and good next tests to add |

> ⚠️ **Before going public**, complete the owner‑side items in `AUDIT.md` / `SECURITY.md` —
> most importantly, **lock the Realtime Database rules** and enable real authentication.
