# Testing

Test runner: **Karma + Jasmine** (Angular default). Specs live next to their source as
`*.spec.ts`.

```bash
npm test           # interactive (watch) — opens Chrome
npm run test:ci    # one-shot headless run (for CI)
```

## What's set up (skeleton)

This is a starting baseline you can grow — the scaffold's broken specs were fixed and a few
representative examples added:

| Spec | Demonstrates |
|---|---|
| `app.spec.ts` | Bootstrapping a component with `provideRouter([])` + zoneless CD |
| `shared/services/data.service.spec.ts` | Testing a Firebase service by **stubbing the `Database` token** (no live app) |
| `shared/utils/push-id.spec.ts` | Pure unit test of a utility function |
| `shared/utils/ui.spec.ts` | Pure unit tests (initials, status label/colour, formatting) |
| `shared/ui/status-badge/status-badge.spec.ts` | Component test using `componentRef.setInput()` for signal inputs |

## Patterns to reuse

- **Pure functions** (`utils/`) — import and assert; no TestBed needed. Cheapest, most valuable.
- **Services that use Firebase** — provide a stub for the injected token, e.g.
  `{ provide: Database, useValue: {} as Database }`, so the unit doesn't hit the network.
- **Standalone components** — add the component to `imports`, `provideZonelessChangeDetection()`,
  set signal inputs via `fixture.componentRef.setInput('name', value)`, then `detectChanges()`.
- **Signal stores** (`EmergencyService`, `RecordsService`) — to test computed filters/stats,
  inject with a mock `DataService` returning a controlled `Observable` and assert the computed
  signals.

## Good next tests to add

- `EmergencyService` filtering/sorting/stats (mock `DataService.getData`).
- `RecordsService.normalize` (flat vs nested `user`, lat/lng coercion, push-id timestamps).
- `GenericListComponent` filter + pagination logic.
- `AuthService` sign-in success/failure against the hashed operator list.
