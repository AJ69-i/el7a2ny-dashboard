import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { RecordsService } from '../../core/services/records.service';
import { FlatRecord } from '../../shared/interfaces/record';
import { ColumnDef, ListConfig } from './list-config';
import { initials, timeAgo } from '../../shared/utils/ui';
import { downloadCsv } from '../../shared/utils/csv';
import { IconComponent } from '../../shared/ui/icon/icon';
import { LoadingComponent } from '../../shared/ui/loading/loading';
import { SelectComponent, SelectOption } from '../../shared/ui/select/select';
import { ToastService } from '../../core/services/toast.service';
import { RecordDetailComponent } from './record-detail';

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'telephone', label: 'Phone' },
  { key: 'id', label: 'Customer ID' },
  { key: 'carModel', label: 'Car' },
  { key: 'carPlateNumber', label: 'Plate' },
  { key: 'vin', label: 'VIN' },
  { key: 'cityName', label: 'City' },
  { key: 'area', label: 'Area' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
  { key: 'requestType', label: 'Service type' },
  { key: 'problem', label: 'Problem' },
  { key: 'budge', label: 'Budget' },
  { key: 'describition', label: 'Description' },
];

@Component({
  selector: 'app-generic-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RecordDetailComponent, LoadingComponent, SelectComponent],
  template: `
    <div class="page">
      <div class="app-card filters">
        <label class="search">
          <app-icon name="search" />
          <input
            type="text"
            placeholder="Search…"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
            aria-label="Search"
          />
        </label>
        @if (cfg().showCity && cities().length) {
          <app-select label="City" [options]="cityOptions()" [value]="city()" (valueChange)="city.set($event)" />
        }
        @if (cfg().showStatus && statuses().length) {
          <app-select label="Status" [options]="statusOptions()" [value]="status()" (valueChange)="status.set($event)" />
        }
        @if (hasFilters()) {
          <button class="reset" type="button" (click)="reset()"><app-icon name="x" /> Reset</button>
        }
        <button class="export" type="button" (click)="exportCsv()">
          <app-icon name="download" /> Export
        </button>
      </div>

      <div class="meta"><span><strong>{{ filtered().length }}</strong> of {{ rows().length }} records</span></div>

      <div class="app-card table-card">
        @if (loading() && rows().length === 0) {
          <app-loading label="Loading records…" />
        } @else if (loadError()) {
          <div class="empty err"><app-icon name="alert" /><p>Couldn't load data — {{ loadError() }}</p></div>
        } @else if (filtered().length === 0) {
          <div class="empty"><app-icon name="check-circle" /><p>No records found.</p></div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  @for (col of cfg().columns; track col.key) {
                    <th>
                      <button type="button" class="th" (click)="setSort(col.key)">
                        {{ col.label }}
                        @if (sortKey() === col.key) {
                          <app-icon [name]="sortDir() === 'asc' ? 'arrow-up' : 'arrow-down'" />
                        }
                      </button>
                    </th>
                  }
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (r of paged(); track r.key) {
                  <tr (click)="selectedKey.set(r.key)">
                    @for (col of cfg().columns; track col.key) {
                      <td [attr.data-label]="col.label">
                        @switch (col.type) {
                          @case ('who') {
                            <div class="who">
                              <span class="avatar">{{ ini(r.name || '?') }}</span>
                              <div><strong>{{ r.name || '—' }}</strong><span class="muted">{{ r.telephone || '—' }}</span></div>
                            </div>
                          }
                          @case ('vehicle') {
                            <div class="stack"><span>{{ r.carModel || '—' }}</span><span class="plate">{{ r.carPlateNumber || '—' }}</span></div>
                          }
                          @case ('location') {
                            <div class="stack"><span>{{ r.cityName || '—' }}</span><span class="muted">{{ r.area || '—' }}</span></div>
                          }
                          @case ('booking') {
                            <div class="stack"><span>{{ r.date || '—' }}</span><span class="muted">{{ r.requestType || '—' }}</span></div>
                          }
                          @case ('status') {
                            <span class="badge">{{ r.status || '—' }}</span>
                          }
                          @default {
                            {{ cell(r, col.key) }}
                          }
                        }
                      </td>
                    }
                    <td class="act-cell">
                      <button class="row-btn" type="button" (click)="doAction(r); $event.stopPropagation()">
                        {{ cfg().actionLabel }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
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
            <span class="rng">{{ rangeStart() }}–{{ rangeEnd() }} of {{ total() }}</span>
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

    <app-record-detail
      [record]="selected()"
      [actionLabel]="cfg().actionLabel"
      (close)="selectedKey.set(null)"
      (act)="onDrawerAct()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page {
        display: flex;
        flex-direction: column;
        gap: var(--gap);
      }
      .filters {
        padding: 14px 16px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      .search {
        flex: 1 1 240px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        height: 44px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--bg-app);
        color: var(--text-muted);
      }
      .search:focus-within {
        border-color: var(--brand-red);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-red) 16%, transparent);
      }
      .search input {
        flex: 1;
        border: none;
        background: none;
        outline: none;
        font: inherit;
        color: var(--text-strong);
        min-width: 0;
      }
      .select {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--bg-app);
      }
      .select span {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
      }
      .select select {
        border: none;
        background: none;
        outline: none;
        font: inherit;
        font-weight: 600;
        color: var(--text-strong);
        cursor: pointer;
        text-transform: capitalize;
      }
      .reset {
        height: 44px;
        padding: 0 14px;
        border-radius: var(--r-md);
        border: 1px solid var(--brand-red-300);
        color: var(--brand-red-600);
        background: var(--bg-app);
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .export {
        height: 44px;
        padding: 0 14px;
        border-radius: var(--r-md);
        border: 1px solid var(--border);
        color: var(--text);
        background: var(--bg-app);
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .export:hover {
        border-color: var(--brand-teal);
        color: var(--brand-teal);
      }
      .meta {
        font-size: var(--fs-sm);
        color: var(--text-muted);
      }
      .meta strong {
        color: var(--text-strong);
      }
      .table-card {
        padding: 8px 4px;
      }
      .table-wrap {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--fs-sm);
      }
      thead th {
        text-align: left;
        padding: 4px 16px 12px;
        white-space: nowrap;
      }
      .th {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font: inherit;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }
      .th app-icon {
        font-size: 13px;
        color: var(--brand-red);
      }
      tbody td {
        padding: 12px 16px;
        border-top: 1px solid var(--border);
        vertical-align: middle;
      }
      tbody tr {
        cursor: pointer;
      }
      tbody tr:hover {
        background: color-mix(in srgb, var(--brand-red) 5%, transparent);
      }
      .who {
        display: flex;
        align-items: center;
        gap: 11px;
      }
      .avatar {
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-size: 0.74rem;
        font-weight: 800;
        color: #fff;
        background: var(--grad-navy);
      }
      .who > div {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }
      .who strong {
        color: var(--text-strong);
      }
      .stack {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
      }
      .stack > span:first-child {
        color: var(--text-strong);
        font-weight: 600;
      }
      .plate {
        font-family: ui-monospace, Menlo, monospace;
        font-size: 0.73rem;
        color: var(--text-muted);
        background: var(--bg-muted);
        padding: 1px 6px;
        border-radius: 6px;
        width: fit-content;
        margin-top: 3px;
      }
      .badge {
        display: inline-block;
        font-size: var(--fs-xs);
        font-weight: 700;
        padding: 4px 10px;
        border-radius: var(--r-full);
        color: var(--brand-red-600);
        background: color-mix(in srgb, var(--brand-red) 12%, transparent);
        text-transform: capitalize;
      }
      .act-cell {
        text-align: right;
      }
      .row-btn {
        padding: 7px 13px;
        border-radius: var(--r-full);
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--brand-red-600);
        font-weight: 700;
        font-size: var(--fs-xs);
        white-space: nowrap;
      }
      .row-btn:hover {
        background: var(--brand-red);
        border-color: var(--brand-red);
        color: #fff;
      }
      .empty {
        padding: 48px 20px;
        text-align: center;
        color: var(--text-muted);
      }
      .empty app-icon {
        font-size: 34px;
        color: var(--c-green);
        display: block;
        width: fit-content;
        margin: 0 auto 10px;
      }
      .empty.err app-icon {
        color: var(--c-danger);
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
      @media (max-width: 760px) {
        thead {
          display: none;
        }
        table,
        tbody,
        tbody tr,
        tbody td {
          display: block;
          width: 100%;
        }
        tbody tr {
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          margin-bottom: 12px;
        }
        tbody td {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border: none;
          border-top: 1px solid var(--border);
        }
        tbody td:first-child {
          border-top: none;
          background: var(--bg-app);
        }
        tbody td::before {
          content: attr(data-label);
          font-size: var(--fs-xs);
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .stack {
          align-items: flex-end;
        }
        .act-cell {
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class GenericListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly records = inject(RecordsService);
  private readonly toast = inject(ToastService);

  // Config comes from the route's static data; the component is recreated per route,
  // so reading the snapshot here is correct.
  protected readonly cfg = signal<ListConfig>(this.route.snapshot.data['config'] as ListConfig);

  // Create the Firebase collection signal eagerly (NOT inside a computed) — building a
  // toSignal subscription inside a reactive computation is not allowed and would throw.
  protected readonly rows = this.records.collection(this.cfg().node);
  protected readonly loading = this.records.loading(this.cfg().node);
  protected readonly loadError = this.records.error(this.cfg().node);

  // Pre-fill from query params so analytics drill-downs land filtered.
  protected readonly search = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly city = signal(this.route.snapshot.queryParamMap.get('city') ?? 'all');
  protected readonly status = signal('all');
  protected readonly sortKey = signal('createdAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly selectedKey = signal<string | null>(null);

  protected readonly ini = initials;
  protected readonly timeAgo = timeAgo;

  protected readonly cities = computed(() => this.distinct(this.rows().map((r) => r.cityName)));
  protected readonly statuses = computed(() => this.distinct(this.rows().map((r) => r.status)));

  protected readonly cityOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: 'All' },
    ...this.cities().map((c) => ({ value: c, label: c })),
  ]);
  protected readonly statusOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: 'All' },
    ...this.statuses().map((s) => ({ value: s, label: s })),
  ]);
  protected readonly pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
  ];

  protected readonly hasFilters = computed(
    () => !!this.search() || this.city() !== 'all' || this.status() !== 'all',
  );

  protected readonly filtered = computed<FlatRecord[]>(() => {
    const q = this.search().trim().toLowerCase();
    const city = this.city();
    const status = this.status();
    const list = this.rows().filter((r) => {
      if (city !== 'all' && (r.cityName ?? '').trim().toLowerCase() !== city.toLowerCase()) return false;
      if (status !== 'all' && (r.status ?? '').trim().toLowerCase() !== status.toLowerCase()) return false;
      if (q && !Object.values(r).join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (key === 'createdAt') return (a.createdAt - b.createdAt) * dir;
      return String(this.cell(a, key)).localeCompare(String(this.cell(b, key))) * dir;
    });
  });

  // ---- pagination ----
  protected readonly pageSize = signal(10);
  protected readonly pageIndex = signal(0);
  protected readonly total = computed(() => this.filtered().length);
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly clampedIndex = computed(() =>
    Math.min(Math.max(0, this.pageIndex()), this.totalPages() - 1),
  );
  protected readonly paged = computed<FlatRecord[]>(() => {
    const start = this.clampedIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : this.clampedIndex() * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.total(), (this.clampedIndex() + 1) * this.pageSize()),
  );

  constructor() {
    // Reset to the first page whenever the filters change.
    effect(() => {
      this.search();
      this.city();
      this.status();
      this.pageIndex.set(0);
    });
  }

  protected readonly selected = computed<FlatRecord | null>(() => {
    const k = this.selectedKey();
    return k ? this.rows().find((r) => r.key === k) ?? null : null;
  });

  /** Distinct, trimmed, case-insensitively de-duplicated values for a dropdown. */
  private distinct(values: (string | undefined)[]): string[] {
    const map = new Map<string, string>();
    for (const v of values) {
      const s = (v ?? '').trim();
      if (!s) continue;
      const key = s.toLowerCase();
      if (!map.has(key)) map.set(key, s);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.pageIndex.set(0);
  }

  protected cell(r: FlatRecord, key: string): string {
    const v = (r as unknown as Record<string, unknown>)[key];
    return v === undefined || v === null || v === '' ? '—' : String(v);
  }

  protected setSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected reset(): void {
    this.search.set('');
    this.city.set('all');
    this.status.set('all');
  }

  protected exportCsv(): void {
    downloadCsv(this.cfg().node, this.filtered(), EXPORT_COLUMNS);
  }

  protected async doAction(rec: FlatRecord): Promise<void> {
    const c = this.cfg();
    const labels: Record<string, string> = {
      done: 'marked as done',
      restore: 'restored',
      vip: 'added to VIP',
      remove: 'removed',
    };
    try {
      if (c.action === 'done' && c.targetNode) await this.records.softDelete(c.node, c.targetNode, rec);
      else if (c.action === 'restore' && c.targetNode) await this.records.restore(c.node, c.targetNode, rec);
      else if (c.action === 'vip') this.records.addVip(rec);
      else if (c.action === 'remove') await this.records.removeFrom(c.node, rec);
      this.toast.success(`${rec.name || 'Record'} ${labels[c.action]}.`);
      if (this.selectedKey() === rec.key) this.selectedKey.set(null);
    } catch {
      this.toast.error('Action failed — check your connection or database permissions.');
    }
  }

  protected onDrawerAct(): void {
    const r = this.selected();
    if (r) this.doAction(r);
  }
}
