import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';
import { authGuard } from './core/guards/auth.guard';
import { LIST_CONFIGS } from './features/records/list-config';

/** Builds a route for a config-driven generic list page. */
function listRoute(key: string): Routes[number] {
  return {
    path: key,
    title: LIST_CONFIGS[key].title + ' · El7a2ny',
    data: { config: LIST_CONFIGS[key] },
    loadComponent: () => import('./features/records/generic-list').then((m) => m.GenericListComponent),
  };
}

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · El7a2ny',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · El7a2ny',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'emergency',
        title: 'Emergency · El7a2ny',
        loadComponent: () =>
          import('./features/requests/requests-page').then((m) => m.RequestsPageComponent),
      },
      {
        path: 'map',
        title: 'Live Map · El7a2ny',
        loadComponent: () => import('./features/map/map-page').then((m) => m.MapPageComponent),
      },
      {
        path: 'analytics',
        title: 'Analytics · El7a2ny',
        loadComponent: () => import('./features/analytics/analytics').then((m) => m.AnalyticsComponent),
      },
      {
        path: 'customer/:id',
        title: 'Customer · El7a2ny',
        loadComponent: () =>
          import('./features/customer/customer-profile').then((m) => m.CustomerProfileComponent),
      },
      {
        path: 'offline-days',
        title: 'Offline days · El7a2ny',
        loadComponent: () =>
          import('./features/offline-days/offline-days').then((m) => m.OfflineDaysComponent),
      },
      listRoute('maintenance'),
      listRoute('amendments'),
      listRoute('customers'),
      listRoute('vip'),
      listRoute('emergency-history'),
      listRoute('maintenance-history'),
      listRoute('amendment-history'),
      listRoute('users-history'),
    ],
  },
  { path: '**', redirectTo: '' },
];
