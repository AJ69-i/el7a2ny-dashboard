import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AggregateService } from '../../core/services/aggregate.service';
import { DonutChartComponent, DonutSegment } from '../../shared/ui/charts/donut-chart';
import { BarChartComponent, BarDatum } from '../../shared/ui/charts/bar-chart';
import { AreaChartComponent, AreaPoint } from '../../shared/ui/charts/area-chart';
import { IconComponent } from '../../shared/ui/icon/icon';

function topCounts(values: (string | undefined)[], limit = 8): BarDatum[] {
  const map = new Map<string, { label: string; value: number }>();
  for (const v of values) {
    const s = (v ?? '').trim();
    if (!s) continue;
    const key = s.toLowerCase();
    const e = map.get(key);
    if (e) e.value++;
    else map.set(key, { label: s, value: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, limit);
}

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DonutChartComponent, BarChartComponent, AreaChartComponent, IconComponent],
  template: `
    <div class="page">
      <div class="kpis">
        <div class="app-card kpi" style="--ac: var(--brand-navy-600)">
          <span class="ic"><app-icon name="users" /></span>
          <span class="v">{{ agg.customers().length }}</span>
          <span class="l">Customers</span>
        </div>
        <div class="app-card kpi" style="--ac: var(--c-amber)">
          <span class="ic"><app-icon name="star" /></span>
          <span class="v">{{ agg.vip().length }} <small>({{ vipShare() }}%)</small></span>
          <span class="l">VIP customers</span>
        </div>
        <div class="app-card kpi" style="--ac: var(--brand-red)">
          <span class="ic"><app-icon name="activity" /></span>
          <span class="v">{{ agg.allRequests().length }}</span>
          <span class="l">Total requests (all time)</span>
        </div>
        <div class="app-card kpi" style="--ac: var(--brand-teal)">
          <span class="ic"><app-icon name="trend-up" /></span>
          <span class="v">{{ tuningSpendLabel() }}</span>
          <span class="l">Tuning spend (EGP)</span>
        </div>
      </div>

      <p class="tip"><app-icon name="search" /> Click any bar or legend item to open the matching filtered list.</p>

      <section class="grid two">
        <article class="app-card pad">
          <h3>Requests by category</h3>
          <app-donut-chart
            [segments]="byCategory()"
            [centerValue]="agg.allRequests().length"
            centerLabel="requests"
            [clickable]="true"
            (segClick)="goCategory($event)"
          />
        </article>
        <article class="app-card pad">
          <h3>Maintenance by type</h3>
          <app-bar-chart [data]="maintByType()" color="var(--brand-teal)" [max]="6" [clickable]="true" (barClick)="goType($event)" />
        </article>
      </section>

      <section class="grid two">
        <article class="app-card pad">
          <h3>Top car brands</h3>
          <app-bar-chart [data]="topBrands()" color="var(--brand-red)" [max]="8" [clickable]="true" (barClick)="goBrand($event)" />
        </article>
        <article class="app-card pad">
          <h3>Top cities</h3>
          <app-bar-chart [data]="topCities()" color="var(--brand-navy-600)" [max]="8" [clickable]="true" (barClick)="goCity($event)" />
        </article>
      </section>

      <section class="app-card pad">
        <h3>Requests over time (by month)</h3>
        <app-area-chart [data]="byMonth()" color="var(--brand-red)" />
      </section>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .page { display: flex; flex-direction: column; gap: var(--gap); }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: var(--gap);
      }
      .kpi { padding: 18px; position: relative; overflow: hidden; }
      .kpi::after { content: ''; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--ac); }
      .ic {
        width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center;
        font-size: 20px; color: var(--ac); background: color-mix(in srgb, var(--ac) 13%, transparent);
        margin-bottom: 12px;
      }
      .v { display: block; font-size: 1.9rem; font-weight: 800; color: var(--text-strong); line-height: 1; }
      .v small { font-size: 0.95rem; font-weight: 700; color: var(--text-muted); }
      .l { font-size: var(--fs-sm); color: var(--text-muted); }
      .grid { display: grid; gap: var(--gap); }
      .two { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
      .pad { padding: 20px; }
      h3 { font-size: var(--fs-h2); color: var(--text-strong); margin-bottom: 16px; }
      .tip {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: var(--fs-sm);
        color: var(--text-muted);
        margin: -4px 2px 0;
      }
      .tip app-icon { color: var(--brand-teal); }
    `,
  ],
})
export class AnalyticsComponent {
  protected readonly agg = inject(AggregateService);
  private readonly router = inject(Router);

  protected goCity(d: BarDatum): void {
    this.router.navigate(['/customers'], { queryParams: { city: d.label } });
  }
  protected goBrand(d: BarDatum): void {
    this.router.navigate(['/customers'], { queryParams: { q: d.label } });
  }
  protected goType(d: BarDatum): void {
    this.router.navigate(['/maintenance'], { queryParams: { q: d.label } });
  }
  protected goCategory(s: DonutSegment): void {
    const route =
      s.label === 'Emergency' ? '/emergency' : s.label === 'Maintenance' ? '/maintenance' : '/amendments';
    this.router.navigate([route]);
  }

  protected readonly vipShare = computed(() => {
    const total = this.agg.customers().length;
    return total ? Math.round((this.agg.vip().length / total) * 100) : 0;
  });

  protected readonly tuningSpendLabel = computed(() =>
    this.agg
      .allRequests()
      .filter((r) => r.kind === 'amendment')
      .reduce((s, r) => s + (Number(r.budge) || 0), 0)
      .toLocaleString(),
  );

  protected readonly byCategory = computed<DonutSegment[]>(() => {
    const all = this.agg.allRequests();
    const count = (k: string) => all.filter((r) => r.kind === k).length;
    return [
      { label: 'Emergency', value: count('emergency'), color: 'var(--st-new)' },
      { label: 'Maintenance', value: count('maintenance'), color: 'var(--brand-teal)' },
      { label: 'Amendment', value: count('amendment'), color: 'var(--c-amber)' },
    ];
  });

  protected readonly maintByType = computed<BarDatum[]>(() =>
    topCounts(
      [...this.agg.maintenance(), ...this.agg.maintenanceHist()].map((r) => r.requestType),
      6,
    ),
  );

  protected readonly topBrands = computed<BarDatum[]>(() =>
    topCounts(
      this.agg.allRequests().map((r) => (r.carModel ?? '').trim().split(/\s+/)[0]),
      8,
    ),
  );

  protected readonly topCities = computed<BarDatum[]>(() =>
    topCounts(this.agg.customers().map((r) => r.cityName), 8),
  );

  protected readonly byMonth = computed<AreaPoint[]>(() => {
    const buckets = new Map<string, { label: string; value: number }>();
    for (const r of this.agg.allRequests()) {
      if (!r.createdAt) continue;
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      const e = buckets.get(key);
      if (e) e.value++;
      else buckets.set(key, { label, value: 1 });
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([, v]) => ({ label: v.label, value: v.value }));
  });
}
