import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EmergencyService } from '../../../../core/services/emergency.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';

interface Kpi {
  label: string;
  value: string;
  icon: string;
  color: string;
  hint: string;
  progress?: number;
}

@Component({
  selector: 'app-stat-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="grid">
      @for (k of kpis(); track k.label) {
        <article class="kpi app-card" [style.--accent]="k.color">
          <div class="kpi-top">
            <span class="kpi-icon"><app-icon [name]="k.icon" /></span>
            <span class="kpi-hint">{{ k.hint }}</span>
          </div>
          <div class="kpi-value">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
          @if (k.progress !== undefined) {
            <div class="kpi-bar"><span [style.width.%]="k.progress"></span></div>
          }
        </article>
      }
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: var(--gap);
      }
      .kpi {
        position: relative;
        padding: 18px 18px 20px;
        overflow: hidden;
        transition: transform var(--t-fast), box-shadow var(--t-fast);
      }
      .kpi::after {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
        background: var(--accent);
        opacity: 0.9;
      }
      .kpi:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
      }
      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .kpi-icon {
        width: 42px;
        height: 42px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        font-size: 21px;
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 13%, transparent);
      }
      .kpi-hint {
        font-size: var(--fs-xs);
        font-weight: 600;
        color: var(--text-muted);
      }
      .kpi-value {
        font-size: clamp(1.7rem, 1.3rem + 1vw, 2.2rem);
        font-weight: 800;
        line-height: 1;
        color: var(--text-strong);
      }
      .kpi-label {
        margin-top: 6px;
        font-size: var(--fs-sm);
        color: var(--text-muted);
        font-weight: 500;
      }
      .kpi-bar {
        margin-top: 14px;
        height: 6px;
        border-radius: var(--r-full);
        background: var(--bg-muted);
        overflow: hidden;
      }
      .kpi-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--accent);
        transition: width var(--t) var(--ease);
      }
    `,
  ],
})
export class StatCardsComponent {
  protected readonly em = inject(EmergencyService);

  protected readonly kpis = computed<Kpi[]>(() => {
    const s = this.em.byStatus();
    return [
      {
        label: 'Total requests',
        value: String(this.em.total()),
        icon: 'activity',
        color: 'var(--brand-navy-600)',
        hint: 'all time',
      },
      {
        label: 'Active rescues',
        value: String(this.em.activeCount()),
        icon: 'truck',
        color: 'var(--brand-red)',
        hint: 'in progress',
      },
      {
        label: 'New / unassigned',
        value: String(s.new),
        icon: 'alert',
        color: 'var(--c-amber)',
        hint: 'needs action',
      },
      {
        label: 'Resolved',
        value: String(s.resolved),
        icon: 'check-circle',
        color: 'var(--c-green)',
        hint: 'completed',
      },
      {
        label: 'Resolution rate',
        value: this.em.resolvedRate() + '%',
        icon: 'trend-up',
        color: 'var(--brand-teal)',
        hint: 'resolved / total',
        progress: this.em.resolvedRate(),
      },
    ];
  });
}
