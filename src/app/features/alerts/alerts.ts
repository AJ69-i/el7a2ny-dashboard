import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { EmergencyService } from '../../core/services/emergency.service';
import { IEmergencyView } from '../../shared/interfaces/emergency';
import { initials, timeAgo } from '../../shared/utils/ui';
import { IconComponent } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-alerts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button class="bell" type="button" (click)="toggle()" aria-label="Alerts" title="Alerts">
      <app-icon name="bell" />
      @if (count() > 0) {
        <span class="dot">{{ count() }}</span>
      }
    </button>

    @if (open()) {
      <div class="panel" role="dialog" aria-label="New requests">
        <div class="head">
          <strong>New requests</strong>
          <span class="cnt">{{ count() }}</span>
        </div>

        @if (items().length === 0) {
          <p class="empty"><app-icon name="check-circle" /> You're all caught up.</p>
        } @else {
          <ul>
            @for (r of items(); track r.key) {
              <li (click)="openItem(r)" tabindex="0" (keydown.enter)="openItem(r)">
                <span class="pin"></span>
                <div class="info">
                  <strong>{{ r.name }}</strong>
                  <span>{{ r.city }} · {{ ago(r.createdAt) }}</span>
                </div>
                <app-icon name="chevron-right" />
              </li>
            }
          </ul>
        }

        <button class="foot" type="button" (click)="viewAll()">View all emergencies</button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: relative;
        display: inline-block;
      }
      .bell {
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        font-size: 19px;
        color: var(--text);
        background: var(--bg-card);
        border: 1px solid var(--border);
        transition: color var(--t-fast), border-color var(--t-fast);
      }
      .bell:hover {
        color: var(--brand-red);
        border-color: var(--brand-red-300);
      }
      .dot {
        position: absolute;
        top: -5px;
        right: -5px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: var(--r-full);
        background: var(--brand-red);
        color: #fff;
        font-size: 0.64rem;
        font-weight: 700;
        display: grid;
        place-items: center;
        border: 2px solid var(--bg-card);
      }
      .panel {
        position: absolute;
        z-index: 60;
        top: calc(100% + 8px);
        right: 0;
        width: 300px;
        max-width: 90vw;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
        animation: a-in 0.16s var(--ease);
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 16px;
        border-bottom: 1px solid var(--border);
      }
      .head strong {
        color: var(--text-strong);
      }
      .cnt {
        font-size: var(--fs-xs);
        font-weight: 800;
        color: var(--brand-red-600);
        background: color-mix(in srgb, var(--brand-red) 13%, transparent);
        padding: 2px 9px;
        border-radius: var(--r-full);
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 6px;
        max-height: 320px;
        overflow-y: auto;
      }
      li {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 10px 10px;
        border-radius: var(--r-sm);
        cursor: pointer;
      }
      li:hover {
        background: color-mix(in srgb, var(--brand-red) 7%, transparent);
      }
      .pin {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--st-new);
        flex: 0 0 auto;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--st-new) 18%, transparent);
      }
      .info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .info strong {
        color: var(--text-strong);
        font-size: var(--fs-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .info span {
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }
      li app-icon {
        color: var(--text-muted);
        font-size: 16px;
      }
      .empty {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 26px 16px;
        color: var(--text-muted);
        font-size: var(--fs-sm);
      }
      .empty app-icon {
        color: var(--c-green);
        font-size: 18px;
      }
      .foot {
        width: 100%;
        padding: 12px;
        border-top: 1px solid var(--border);
        background: var(--bg-app);
        font-weight: 700;
        font-size: var(--fs-sm);
        color: var(--brand-red-600);
      }
      .foot:hover {
        background: color-mix(in srgb, var(--brand-red) 8%, transparent);
      }
      @keyframes a-in {
        from {
          opacity: 0;
          transform: translateY(-6px);
        }
      }
    `,
  ],
})
export class AlertsComponent {
  private readonly em = inject(EmergencyService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  protected readonly ago = timeAgo;
  protected readonly ini = initials;
  protected readonly open = signal(false);

  protected readonly count = computed(() => this.em.byStatus().new);
  protected readonly items = computed<IEmergencyView[]>(() =>
    this.em
      .all()
      .filter((e) => e.status === 'new')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6),
  );

  protected toggle(): void {
    this.open.update((o) => !o);
  }

  protected openItem(r: IEmergencyView): void {
    this.open.set(false);
    // Open this request's detail drawer on the Emergency page (via query param).
    this.router.navigate(['/emergency'], { queryParams: { open: r.key } });
  }

  protected viewAll(): void {
    this.open.set(false);
    this.em.statusFilter.set('new');
    this.router.navigate(['/emergency']);
  }

  @HostListener('document:click', ['$event'])
  protected onDocClick(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }
}
