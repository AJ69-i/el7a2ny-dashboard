import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { EmergencyService } from '../../core/services/emergency.service';
import { IEmergencyView } from '../../shared/interfaces/emergency';
import { FiltersBarComponent } from './components/filters-bar/filters-bar';
import { RequestsTableComponent } from './components/requests-table/requests-table';
import { RequestDetailComponent } from './components/request-detail/request-detail';
import { IconComponent } from '../../shared/ui/icon/icon';
import { LoadingComponent } from '../../shared/ui/loading/loading';
import { SelectComponent, SelectOption } from '../../shared/ui/select/select';
import { downloadCsv } from '../../shared/utils/csv';

const EMERGENCY_EXPORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'telephone', label: 'Phone' },
  { key: 'userId', label: 'Customer ID' },
  { key: 'carModel', label: 'Car' },
  { key: 'carPlateNumber', label: 'Plate' },
  { key: 'vin', label: 'VIN' },
  { key: 'city', label: 'City' },
  { key: 'area', label: 'Area' },
  { key: 'status', label: 'Status' },
  { key: 'latitude', label: 'Latitude' },
  { key: 'longitude', label: 'Longitude' },
];

@Component({
  selector: 'app-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FiltersBarComponent,
    RequestsTableComponent,
    RequestDetailComponent,
    IconComponent,
    LoadingComponent,
    SelectComponent,
  ],
  template: `
    <div class="page">
      <app-filters-bar />

      <div class="result-meta">
        <span><strong>{{ em.filtered().length }}</strong> of {{ em.total() }} requests</span>
        @if (em.error()) {
          <span class="err">Live connection issue — showing last known data.</span>
        }
        <button class="export" type="button" (click)="exportCsv()">
          <app-icon name="download" /> Export
        </button>
      </div>

      <div class="app-card table-card">
        @if (!em.loaded()) {
          <app-loading label="Loading requests…" />
        } @else {
          <app-requests-table [rows]="paged()" (select)="open($event)" />
        }

        @if (em.loaded() && em.filtered().length > 0) {
          <div class="pager">
            <label class="rpp">
              Rows
              <app-select
                [compact]="true"
                [options]="pageSizeOptions"
                [value]="pageSize() + ''"
                (valueChange)="setPageSize($event)"
              />
            </label>
            <span class="rng">{{ rangeStart() }}–{{ rangeEnd() }} of {{ em.filtered().length }}</span>
            <div class="pbtns">
              <button
                type="button"
                [disabled]="clampedIndex() === 0"
                (click)="pageIndex.set(clampedIndex() - 1)"
                aria-label="Previous page"
              >
                <app-icon name="chevron-left" />
              </button>
              <span class="pno">{{ clampedIndex() + 1 }} / {{ totalPages() }}</span>
              <button
                type="button"
                [disabled]="clampedIndex() >= totalPages() - 1"
                (click)="pageIndex.set(clampedIndex() + 1)"
                aria-label="Next page"
              >
                <app-icon name="chevron-right" />
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <app-request-detail [request]="selected()" (close)="selectedKey.set(null)" />
  `,
  styles: [
    `
      .page {
        display: flex;
        flex-direction: column;
        gap: var(--gap);
      }
      .result-meta {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }
      .result-meta strong {
        color: var(--text-strong);
      }
      .err {
        color: var(--c-warning);
      }
      .export {
        margin-left: auto;
        height: 36px;
        padding: 0 13px;
        border-radius: var(--r-md);
        border: 1px solid var(--border);
        color: var(--text);
        background: var(--bg-card);
        font-weight: 600;
        font-size: var(--fs-sm);
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .export:hover {
        border-color: var(--brand-teal);
        color: var(--brand-teal);
      }
      .table-card {
        padding: 8px 4px;
      }
      .pager {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 18px;
        flex-wrap: wrap;
        padding: 12px 16px 6px;
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }
      .rpp {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rpp select {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 5px 8px;
        font: inherit;
        background: var(--bg-app);
        color: var(--text-strong);
        cursor: pointer;
      }
      .pbtns {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pbtns button {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: var(--bg-card);
        display: grid;
        place-items: center;
        font-size: 16px;
        color: var(--text);
      }
      .pbtns button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pbtns button:not(:disabled):hover {
        border-color: var(--brand-red);
        color: var(--brand-red);
      }
      .pno {
        font-weight: 700;
        color: var(--text-strong);
        min-width: 52px;
        text-align: center;
      }
    `,
  ],
})
export class RequestsPageComponent {
  protected readonly em = inject(EmergencyService);
  private readonly route = inject(ActivatedRoute);

  // `?open=<key>` (e.g. from the alerts bell) opens that request's detail drawer.
  private readonly openParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('open'))),
    { initialValue: this.route.snapshot.queryParamMap.get('open') },
  );

  protected readonly pageSize = signal(10);
  protected readonly pageIndex = signal(0);
  protected readonly pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
  ];
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.em.filtered().length / this.pageSize())),
  );
  protected readonly clampedIndex = computed(() =>
    Math.min(Math.max(0, this.pageIndex()), this.totalPages() - 1),
  );
  protected readonly paged = computed<IEmergencyView[]>(() => {
    const start = this.clampedIndex() * this.pageSize();
    return this.em.filtered().slice(start, start + this.pageSize());
  });
  protected readonly rangeStart = computed(() =>
    this.em.filtered().length === 0 ? 0 : this.clampedIndex() * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.em.filtered().length, (this.clampedIndex() + 1) * this.pageSize()),
  );

  protected readonly selectedKey = signal<string | null>(null);
  protected readonly selected = computed<IEmergencyView | null>(() => {
    const k = this.selectedKey();
    return k ? this.em.all().find((e) => e.key === k) ?? null : null;
  });

  constructor() {
    // Reset to the first page when filters change.
    effect(() => {
      this.em.search();
      this.em.statusFilter();
      this.em.cityFilter();
      this.pageIndex.set(0);
    });

    // Open a request's drawer when arrived via ?open=<key>.
    effect(() => {
      const k = this.openParam();
      if (k) this.selectedKey.set(k);
    });
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pageIndex.set(0);
  }

  protected exportCsv(): void {
    downloadCsv('emergency', this.em.filtered(), EMERGENCY_EXPORT_COLUMNS);
  }

  protected open(r: IEmergencyView): void {
    this.selectedKey.set(r.key);
  }
}
