import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { IconComponent } from '../../shared/ui/icon/icon';
import { GlobalSearchComponent } from '../../features/search/global-search';
import { AlertsComponent } from '../../features/alerts/alerts';
import { ToastComponent } from '../../shared/ui/toast/toast';
import { initials } from '../../shared/utils/ui';
import { EmergencyService } from '../../core/services/emergency.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { MessagingService } from '../../core/services/messaging.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}
interface NavGroup {
  title?: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    GlobalSearchComponent,
    AlertsComponent,
    ToastComponent,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly em = inject(EmergencyService);
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly messaging = inject(MessagingService);

  protected readonly navGroups: NavGroup[] = [
    {
      items: [
        { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: 'analytics', label: 'Analytics', icon: 'trend-up' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { path: 'emergency', label: 'Emergency', icon: 'shield' },
        { path: 'maintenance', label: 'Maintenance', icon: 'wrench' },
        { path: 'amendments', label: 'Amendments', icon: 'edit' },
      ],
    },
    {
      title: 'Customers',
      items: [
        { path: 'customers', label: 'Customers', icon: 'users' },
        { path: 'vip', label: 'VIP customers', icon: 'star' },
      ],
    },
    { title: 'Scheduling', items: [{ path: 'offline-days', label: 'Offline days', icon: 'calendar' }] },
    {
      title: 'History',
      items: [
        { path: 'emergency-history', label: 'Emergency history', icon: 'refresh' },
        { path: 'maintenance-history', label: 'Maintenance history', icon: 'refresh' },
        { path: 'amendment-history', label: 'Amendment history', icon: 'refresh' },
        { path: 'users-history', label: 'Users history', icon: 'refresh' },
      ],
    },
    { items: [{ path: 'map', label: 'Live map', icon: 'map' }] },
  ];

  private readonly allItems = this.navGroups.flatMap((g) => g.items);

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly dark = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly logoSrc = signal('logo.webp');
  protected readonly avatarBroken = signal(false);
  protected readonly initials = initials;

  /** Falls back to the project's hosted logo if /logo.webp isn't in public/. */
  protected onLogoError(): void {
    const hosted = 'https://aj69-i.github.io/El7a2ny/assets/img/logo.webp';
    if (this.logoSrc() !== hosted) this.logoSrc.set(hosted);
  }

  /** Show initials if the operator photo can't load. */
  protected onAvatarError(): void {
    this.avatarBroken.set(true);
  }

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly currentTitle = computed(() => {
    const seg = this.url().split('?')[0].split('/')[1] || 'dashboard';
    return this.allItems.find((n) => n.path === seg)?.label ?? 'Dashboard';
  });

  constructor() {
    effect(() => {
      this.url();
      this.mobileOpen.set(false);
    });

    effect(() => {
      const isDark = this.dark();
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.classList.toggle('theme-dark', isDark);
      }
    });

    // Watch the live request nodes and notify operators of new arrivals.
    this.notifications.start([
      { node: 'emergency', label: 'emergency', urgent: true },
      { node: 'maintaince_Request', label: 'maintenance' },
      { node: 'carEditRequest', label: 'amendment' },
    ]);

    // Background push (FCM) — no-op unless a VAPID key is configured (see FCM_PUSH.md).
    void this.messaging.init();
  }

  protected toggleSidebar(): void {
    if (isPlatformBrowser(this.platformId) && window.innerWidth < 1024) {
      this.mobileOpen.update((v) => !v);
    } else {
      this.collapsed.update((v) => !v);
    }
  }

  protected toggleTheme(): void {
    this.dark.update((v) => !v);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.searchOpen.set(true);
    }
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
