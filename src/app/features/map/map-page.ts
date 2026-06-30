import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { EmergencyService } from '../../core/services/emergency.service';
import { IEmergencyView } from '../../shared/interfaces/emergency';
import { EmergencyMapComponent } from './components/emergency-map/emergency-map';
import { RequestDetailComponent } from '../requests/components/request-detail/request-detail';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';
import { timeAgo } from '../../shared/utils/ui';

@Component({
  selector: 'app-map-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmergencyMapComponent, RequestDetailComponent, StatusBadgeComponent],
  template: `
    <div class="map-page">
      <div class="app-card map-card">
        <app-emergency-map [points]="em.filtered()" height="100%" (select)="open($event)" />
      </div>

      <aside class="app-card side">
        <header class="side-head">
          <h3>Locations</h3>
          <span class="count">{{ em.filtered().length }}</span>
        </header>
        <ul class="loc-list">
          @for (p of em.filtered(); track p.key) {
            <li
              [class.sel]="selectedKey() === p.key"
              tabindex="0"
              (click)="open(p)"
              (keydown.enter)="open(p)"
            >
              <span class="pin" [style.background]="'var(--st-' + p.status + ')'"></span>
              <div class="info">
                <strong>{{ p.name }}</strong>
                <span class="muted">{{ p.city }} · {{ p.area }}</span>
              </div>
              <div class="end">
                <app-status-badge [status]="p.status" />
                <span class="ago">{{ timeAgo(p.createdAt) }}</span>
              </div>
            </li>
          } @empty {
            <li class="none">No active locations.</li>
          }
        </ul>
      </aside>
    </div>

    <app-request-detail [request]="selected()" (close)="selectedKey.set(null)" />
  `,
  styles: [
    `
      .map-page {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: var(--gap);
        height: calc(100vh - var(--topbar-h) - 2 * var(--page-pad));
        min-height: 480px;
      }
      .map-card {
        padding: 0;
        overflow: hidden;
        height: 100%;
      }
      .side {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 0;
      }
      .side-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid var(--border);
      }
      .side-head h3 {
        font-size: var(--fs-h2);
        color: var(--text-strong);
      }
      .count {
        font-weight: 800;
        color: var(--brand-red);
        background: color-mix(in srgb, var(--brand-red) 12%, transparent);
        padding: 2px 12px;
        border-radius: var(--r-full);
      }
      .loc-list {
        list-style: none;
        margin: 0;
        padding: 6px;
        overflow-y: auto;
        flex: 1;
      }
      .loc-list li {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 12px;
        border-radius: var(--r-md);
        cursor: pointer;
        transition: background var(--t-fast);
      }
      .loc-list li:hover,
      .loc-list li.sel {
        background: color-mix(in srgb, var(--brand-teal) 8%, transparent);
      }
      .pin {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex: 0 0 auto;
        box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 8%, transparent);
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
      .info .muted {
        font-size: var(--fs-xs);
      }
      .end {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      .ago {
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }
      .none {
        padding: 24px;
        text-align: center;
        color: var(--text-muted);
      }

      @media (max-width: 900px) {
        .map-page {
          grid-template-columns: 1fr;
          height: auto;
        }
        .map-card {
          height: 60vh;
          min-height: 360px;
        }
        .side {
          max-height: 420px;
        }
      }
    `,
  ],
})
export class MapPageComponent {
  protected readonly em = inject(EmergencyService);
  protected readonly timeAgo = timeAgo;

  protected readonly selectedKey = signal<string | null>(null);
  protected readonly selected = computed<IEmergencyView | null>(() => {
    const k = this.selectedKey();
    return k ? this.em.all().find((e) => e.key === k) ?? null : null;
  });

  protected open(r: IEmergencyView): void {
    this.selectedKey.set(r.key);
  }
}
