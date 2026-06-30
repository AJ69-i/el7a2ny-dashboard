import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmergencyService } from '../../core/services/emergency.service';
import { RecordsService } from '../../core/services/records.service';
import {
  EMERGENCY_STATUSES,
  IEmergencyView,
  STATUS_LABEL,
} from '../../shared/interfaces/emergency';

import { StatCardsComponent } from './components/stat-cards/stat-cards';
import { AreaChartComponent } from '../../shared/ui/charts/area-chart';
import { DonutChartComponent, DonutSegment } from '../../shared/ui/charts/donut-chart';
import { BarChartComponent, BarDatum } from '../../shared/ui/charts/bar-chart';
import { AreaPoint } from '../../shared/ui/charts/area-chart';
import { EmergencyMapComponent } from '../map/components/emergency-map/emergency-map';
import { FiltersBarComponent } from '../requests/components/filters-bar/filters-bar';
import { RequestsTableComponent } from '../requests/components/requests-table/requests-table';
import { RequestDetailComponent } from '../requests/components/request-detail/request-detail';
import { IconComponent } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    StatCardsComponent,
    AreaChartComponent,
    DonutChartComponent,
    BarChartComponent,
    EmergencyMapComponent,
    FiltersBarComponent,
    RequestsTableComponent,
    RequestDetailComponent,
    IconComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  protected readonly em = inject(EmergencyService);
  private readonly records = inject(RecordsService);

  // Created eagerly (not inside the computed) — see note in generic-list.ts.
  private readonly maintenanceRows = this.records.collection('maintaince_Request');
  private readonly amendmentRows = this.records.collection('carEditRequest');
  private readonly customerRows = this.records.collection('users');
  private readonly vipRows = this.records.collection('vip');

  protected readonly modules = computed(() => [
    {
      label: 'Maintenance',
      value: this.maintenanceRows().length,
      icon: 'truck',
      link: 'maintenance',
      color: 'var(--brand-red)',
    },
    {
      label: 'Amendments',
      value: this.amendmentRows().length,
      icon: 'activity',
      link: 'amendments',
      color: 'var(--c-amber)',
    },
    {
      label: 'Customers',
      value: this.customerRows().length,
      icon: 'users',
      link: 'customers',
      color: 'var(--brand-teal)',
    },
    {
      label: 'VIP customers',
      value: this.vipRows().length,
      icon: 'check-circle',
      link: 'vip',
      color: 'var(--brand-navy-600)',
    },
  ]);

  protected readonly statusSegments = computed<DonutSegment[]>(() => {
    const s = this.em.byStatus();
    return EMERGENCY_STATUSES.map((st) => ({
      label: STATUS_LABEL[st],
      value: s[st],
      color: `var(--st-${st})`,
    }));
  });

  protected readonly timelinePoints = computed<AreaPoint[]>(() =>
    this.em.timeline().map((b) => ({ label: b.label, value: b.count })),
  );

  protected readonly cityData = computed<BarDatum[]>(() =>
    this.em.byCity().map((c) => ({ label: c.city, value: c.count })),
  );

  protected readonly recent = computed<IEmergencyView[]>(() => this.em.filtered().slice(0, 7));

  protected readonly peakDay = computed(() => {
    const t = this.em.timeline();
    return t.reduce((max, b) => (b.count > max.count ? b : max), t[0] ?? { count: 0, label: '—' });
  });

  protected readonly selectedKey = signal<string | null>(null);
  protected readonly selected = computed<IEmergencyView | null>(() => {
    const k = this.selectedKey();
    return k ? this.em.all().find((e) => e.key === k) ?? null : null;
  });

  protected open(r: IEmergencyView): void {
    this.selectedKey.set(r.key);
  }
}
