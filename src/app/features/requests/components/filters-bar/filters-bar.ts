import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EmergencyService, SortKey } from '../../../../core/services/emergency.service';
import { EMERGENCY_STATUSES, EmergencyStatus } from '../../../../shared/interfaces/emergency';
import { statusLabel } from '../../../../shared/utils/ui';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { SelectComponent, SelectOption } from '../../../../shared/ui/select/select';

interface Pill {
  key: EmergencyStatus | 'all';
  label: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-filters-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, SelectComponent],
  template: `
    <div class="filters app-card">
      <div class="row">
        <label class="search">
          <app-icon name="search" />
          <input
            type="text"
            placeholder="Search name, phone, car, plate, VIN…"
            [value]="em.search()"
            (input)="onSearch($event)"
            aria-label="Search requests"
          />
        </label>

        <div class="controls">
          <app-select
            label="City"
            [options]="cityOptions()"
            [value]="em.cityFilter()"
            (valueChange)="em.cityFilter.set($event)"
          />

          <app-select
            label="Sort"
            [options]="sortOptions"
            [value]="em.sortKey()"
            (valueChange)="onSort($event)"
          />

          <button
            class="dir-btn"
            type="button"
            (click)="em.sortDir.set(em.sortDir() === 'asc' ? 'desc' : 'asc')"
            [attr.aria-label]="'Sort direction ' + em.sortDir()"
            [title]="em.sortDir() === 'asc' ? 'Ascending' : 'Descending'"
          >
            <app-icon [name]="em.sortDir() === 'asc' ? 'arrow-up' : 'arrow-down'" />
          </button>

          @if (em.hasActiveFilters()) {
            <button class="reset-btn" type="button" (click)="em.resetFilters()">
              <app-icon name="x" /> Reset
            </button>
          }
        </div>
      </div>

      <div class="pills" role="tablist" aria-label="Filter by status">
        @for (p of pills(); track p.key) {
          <button
            class="pill"
            type="button"
            role="tab"
            [class.active]="em.statusFilter() === p.key"
            [style.--pc]="p.color"
            [attr.aria-selected]="em.statusFilter() === p.key"
            (click)="em.statusFilter.set(p.key)"
          >
            {{ p.label }}<span class="pill-count">{{ p.count }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .filters {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      .search {
        flex: 1 1 280px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        height: 44px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--bg-app);
        color: var(--text-muted);
        transition: border-color var(--t-fast), box-shadow var(--t-fast);
      }
      .search:focus-within {
        border-color: var(--brand-teal);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-teal) 18%, transparent);
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
      .controls {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .select {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 44px;
        padding: 0 6px 0 14px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--bg-app);
      }
      .select span {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .select select {
        border: none;
        background: none;
        outline: none;
        font: inherit;
        font-weight: 600;
        color: var(--text-strong);
        cursor: pointer;
        padding: 0 6px;
        height: 100%;
      }
      .dir-btn,
      .reset-btn {
        height: 44px;
        border-radius: var(--r-md);
        border: 1px solid var(--border);
        background: var(--bg-app);
        color: var(--text);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 19px;
        transition: all var(--t-fast);
      }
      .dir-btn {
        width: 44px;
        justify-content: center;
      }
      .reset-btn {
        padding: 0 14px;
        font-size: var(--fs-sm);
        color: var(--brand-red);
        border-color: var(--brand-red-300);
      }
      .dir-btn:hover {
        border-color: var(--brand-teal);
        color: var(--brand-teal);
      }
      .reset-btn:hover {
        background: color-mix(in srgb, var(--brand-red) 8%, transparent);
      }
      .pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: var(--r-full);
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--text);
        font-size: var(--fs-sm);
        font-weight: 600;
        transition: all var(--t-fast);
      }
      .pill:hover {
        border-color: var(--pc);
        color: var(--pc);
      }
      .pill.active {
        background: var(--pc);
        border-color: var(--pc);
        color: #fff;
      }
      .pill-count {
        font-size: var(--fs-xs);
        font-weight: 800;
        padding: 1px 7px;
        border-radius: var(--r-full);
        background: color-mix(in srgb, var(--pc) 16%, transparent);
        color: var(--pc);
      }
      .pill.active .pill-count {
        background: rgba(255, 255, 255, 0.25);
        color: #fff;
      }
    `,
  ],
})
export class FiltersBarComponent {
  protected readonly em = inject(EmergencyService);

  protected readonly pills = computed<Pill[]>(() => {
    const s = this.em.byStatus();
    return [
      { key: 'all', label: 'All', count: this.em.total(), color: 'var(--brand-navy-600)' },
      ...EMERGENCY_STATUSES.map((st) => ({
        key: st,
        label: statusLabel(st),
        count: s[st],
        color: `var(--st-${st})`,
      })),
    ];
  });

  protected readonly cityOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: 'All cities' },
    ...this.em.cities().map((c) => ({ value: c, label: c })),
  ]);

  protected readonly sortOptions: SelectOption[] = [
    { value: 'createdAt', label: 'Time' },
    { value: 'name', label: 'Name' },
    { value: 'city', label: 'City' },
    { value: 'status', label: 'Status' },
    { value: 'carModel', label: 'Car' },
  ];

  protected onSearch(e: Event): void {
    this.em.search.set((e.target as HTMLInputElement).value);
  }

  protected onSort(value: string): void {
    const key = value as SortKey;
    this.em.sortKey.set(key);
    this.em.sortDir.set(key === 'name' || key === 'city' ? 'asc' : 'desc');
  }
}
