# El7a2ny Dashboard — Upgrade, Redesign & Migration Plan

El7a2ny ("هنصلحهالك في مكانك" — *we'll fix it for you, on the spot*) is a roadside
**Emergency, Tuning & Car Services** operator console. This document maps the **real
existing app** (`El7a2ny-main`, Angular 15), the new Angular 21 architecture, the logo-based
theme, every behaviour to preserve, security issues to fix, and a phased migration roadmap.

---

## 1. What the real project actually is

The original app is `El7a2ny-main` (Downloads) — **Angular 15.2**, classic **NgModules** with
lazy-loaded feature modules. (The `Desktop/el7a2ny-dashboard` folder was an empty Angular 20
scaffold used as the build target.) It is a Firebase-backed operator console with **13 feature
areas** behind a login guard.

### Feature inventory

| Module | Route | Firebase node | Purpose |
|---|---|---|---|
| Login | `/` | *(hardcoded creds)* | Operator sign-in |
| Forget password | `/forget-password` | — | Password reset |
| Emergency | `/emergency` | `emergency` | Live roadside SOS (map + dispatch) |
| Emergency history | `/emergency-history` | `deletedEmergencyUsers` | Archived SOS |
| Maintenance bookings | `/maintenance-booking-requests` | `maintaince_Request` | Home/workshop service requests |
| Maintenance history | `/maintenance-booking-requests-history` | `deletedMaintainceRequestUsers` | Archived bookings |
| Amendment requests | `/amendment-requests` | `carEditRequest` | Tuning / modification requests |
| Amendment history | `/amendment-requests-history` | `deletedCarEditRequestUsers` | Archived amendments |
| VIP customers | `/vip-customers` | `vip` | Priority customers |
| Customers data | `/customers-data` | `users` | All registered customers |
| Users history | `/users-history` | `deletedUsers` | Deleted customers |
| Offline days — home | `/offline-days-home` | `Busydates` (type `Home`) | Block unavailable home-service days |
| Offline days — workshop | `/offline-days-workshop` | `Busydates` (type `Workshop`) | Block unavailable workshop days |

### Firebase data shapes

```
emergency/{id}        : { latitude, longitude, user:{ area, carModel, carPlateNumber,
                          cityName, id, name, password, status, telephone, vin } }
maintaince_Request/{id}: { date, problem, requestType, user:{…same…} }
carEditRequest/{id}    : { budge, describition, user:{…same…} }
vip/{id}               : { area, carModel, carPlateNumber, cityName, id, name,
                          password, status, telephone, vin }   // flat (no nested user)
users/{id}             : { …flat customer fields… }
Busydates/{id}         : { date:'YYYY-MM-DD', type:'Home' | 'Workshop' }
deleted*Users/{id}     : soft-delete archives (read by the *-history pages)
counts/{node}/length   : counters used to fire "new request" browser notifications
```

### Behaviours to preserve (don't break these)

- Each list page streams a node with `onValue`, renders a **Material table** with paginator,
  sort and free-text filter.
- The **"Done"** action soft-deletes: it copies the record into the matching `deleted*` node,
  then removes it from the active node. History pages read those `deleted*` nodes.
- **Browser notifications** fire when a node's length grows past `counts/{node}/length`.
- **Emergency** plots `latitude/longitude` on Google Maps (`@agm/core`).
- **Offline days** push each selected date to `Busydates` with a `Home`/`Workshop` `type`;
  individual or bulk delete.
- **Auth**: login sets `localStorage["Auth"]="Authenticated"`; `AuthGuard` checks it; logout
  clears `localStorage`.

---

## 2. ⚠️ Security issues found (please address)

These exist in the current app and should be fixed during migration:

1. **Hard-coded operator credentials** live in `login.component.ts` (plaintext email/password
   for 4 accounts shipped to the browser). Anyone can read them in dev-tools. **Replace with
   Firebase Authentication.**
2. **Auth is a `localStorage` flag** (`"Authenticated"`) — trivially bypassed. Use real auth
   tokens + route guards.
3. **User `password` fields are stored and displayed** in the database/tables. Passwords should
   never be retrievable in plaintext.
4. **Google Maps API key** is committed in `app.module.ts`; the **Firebase web config** is in
   `environment.ts`. Lock these down with **HTTP-referrer key restrictions**, **Realtime
   Database Security Rules**, and **App Check**.

---

## 3. New architecture (Angular 21)

Standalone components, **signals**, zoneless change detection, lazy routes, SSR-ready — built
in `Desktop/el7a2ny-dashboard`.

The 8 list pages (emergency, maintenance, amendments, customers, VIP + 3 histories) are
**near-identical** today (copy-pasted table + soft-delete + notify logic). The new design
collapses them into **one generic, signal-driven data layer + a parameterised records view**,
configured per node — eliminating ~80% of the duplicated code.

```
src/app/
├─ core/services/        emergency.service.ts (signals: live data, filters, stats, dispatch)
│                        → generalise to records.service.ts(node) for all list pages
├─ shared/
│  ├─ interfaces/        emergency.ts, user.ts  (+ maintenance, amendment, busy-date models)
│  ├─ services/          data.service.ts  (Firebase read/write — contract preserved)
│  ├─ utils/             ui.ts, push-id.ts
│  └─ ui/                icon, status-badge, charts/(donut,bar,area)
├─ layout/shell/         responsive sidebar + topbar + theme toggle (logo branding)
└─ features/
   ├─ dashboard/         KPIs + charts (NEW — cross-module analytics)
   ├─ requests/          generic filter bar + table + detail drawer + dispatch
   ├─ map/               Leaflet + OpenStreetMap (replaces @agm — see §5)
   └─ auth/              login + guard (to add — Firebase Auth)
```

---

## 4. Colour palette (from the logo)

Extracted from the El7a2ny logo — **Orange + Charcoal + White** — defined as CSS variables at
the top of `src/styles.scss`:

| Token | Value | Use |
|---|---|---|
| `--brand-red` (primary) | `#f47c20` | brand orange — actions, active nav, accents |
| `--brand-red-600` | `#d9610e` | hover / deep orange |
| `--brand-navy` (ink) | `#1f1f24` | charcoal — sidebar, headings (matches logo text/car) |
| `--brand-teal` | `#0e7c86` | supporting analytics accent |
| `--st-new … --st-cancelled` | red/violet/sky/green/gray | request-status colours |

> Variable **names** were kept stable (legacy "navy"/"red") so the whole UI re-themed by editing
> only these values. The logo is wired into the sidebar — **copy the logo into the new project**:
> `cp El7a2ny-main/src/assets/img/logo.webp el7a2ny-dashboard/public/logo.webp`

---

## 5. Upgrading Angular 15 → 21 (the dependency reality)

Angular must be upgraded **one major at a time** (`ng update @angular/core@16 @angular/cli@16`,
then 17, 18, 19, 20, 21). Run the schematics at each step. Key per-dependency notes:

| Package (v15) | Action for v21 |
|---|---|
| `@angular/fire` 7.6 | Upgrade to 20.x. App already uses the **modular** API (`ref/onValue/set`), so changes are minimal. Peer-deps cap at Angular 20 → install with `--legacy-peer-deps`. |
| **`@agm/core`** | **Unmaintained — drops after Angular 15.** Replace with the official `@angular/google-maps`, or the keyless **Leaflet + OpenStreetMap** approach already built in `features/map`. |
| `@angular/material` 15 | Upgrade with `ng update @angular/material`; already MDC-based. The redesign replaces most Material tables with the custom responsive table, but Material can stay for datepickers. |
| `bootstrap` 5.3 | Dropped — the new design system (CSS variables + Grid/Flex) replaces it. Remove to cut bundle size. |
| `ngx-spinner` | Replace with a lightweight CSS/signal loader (no dep needed). |
| `ngx-multiple-dates` | Use Angular Material datepicker (range) or a small custom picker for offline-days. |
| `angularx-qrcode` | Upgrade to its Angular 21 line if QR codes are still needed. |
| `izitoast` | Framework-agnostic — keep, or swap for a tiny signal-based toast service. |
| `moment` | Legacy/large — migrate to `date-fns` or native `Intl` over time. |
| `zone.js` | Removed — the new app is **zoneless**. |

### Recommended path

A clean **rebuild on the Angular 21 foundation** (already started) is lower-risk than dragging
13 NgModules through 6 majors plus the dead `@agm` dependency. The Firebase data contract is
preserved, so the rewrite is UI/architecture only — the data stays identical.

---

## 6. Phased roadmap

> **Build status:** all phases (1–7) are implemented in `el7a2ny-dashboard` — foundation,
> generalised config-driven list pages (8 modules), a **local hashed-credential login + guard**
> (no Firebase Auth needed, since the console can't be changed without owner access; fully
> upgradeable to Firebase Auth later), offline-days scheduler, cross-module dashboard,
> new-request browser notifications, and security hardening (password stripping, target DB rules,
> optional App Check). Sign-in details and the upgrade path are in `SECURITY.md`.

1. **Foundation** ✅ — shell, routing, theme (logo palette), signal data layer, charts, map,
   responsive table, detail drawer, dispatch — done for the `emergency` node.
2. **Generalise** the data layer to `records.service.ts(node)` + a config-driven list page →
   covers maintenance, amendments, customers, VIP, and the 3 history pages.
3. **Auth** — Firebase Auth login + route guard (replacing hard-coded creds + localStorage).
4. **Specialised pages** — offline-days (date manager → `Busydates`), maps for emergencies.
5. **Cross-module dashboard** — KPIs/analytics across emergency + maintenance + amendments.
6. **Notifications** — restore the "new request" browser notification via the `counts` nodes.
7. **Hardening** — DB security rules, App Check, key restrictions; remove plaintext passwords.

---

## 7. Run & build

```bash
cp El7a2ny-main/src/assets/img/logo.webp el7a2ny-dashboard/public/logo.webp
cd el7a2ny-dashboard
npm install --legacy-peer-deps
npm start          # http://localhost:4200
npm run build
```

**Sign in** with a local operator account (no Firebase setup needed) — e.g.
`manager@el7a2ny.com` / `SX2GXscW949eG6Fu`. Full list, how to add accounts, and how to disable
the gate are in `SECURITY.md`.

*See `el7a2ny-design-preview.html` for an interactive preview of the redesigned app — orange
rebrand, the real navigation (all modules), tables, dispatch drawer, offline-days manager,
map, and the login screen.*
