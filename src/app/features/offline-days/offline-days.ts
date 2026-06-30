import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { DataService } from '../../shared/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/ui/icon/icon';
import { DatePickerComponent } from '../../shared/ui/date-picker/date-picker';

type DayType = 'Home' | 'Workshop';
interface BusyDate {
  key: string;
  date: string;
  type: string;
}

@Component({
  selector: 'app-offline-days',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, DatePickerComponent],
  template: `
    <div class="page">
      <div class="tabs">
        <button class="tab" [class.on]="type() === 'Home'" (click)="type.set('Home')">
          <app-icon name="navigation" /> Home service
        </button>
        <button class="tab" [class.on]="type() === 'Workshop'" (click)="type.set('Workshop')">
          <app-icon name="truck" /> Workshop
        </button>
      </div>

      <div class="grid">
        <div class="app-card pad">
          <h3>Block a single day</h3>
          <div class="ctrl">
            <app-date-picker [value]="single()" (valueChange)="single.set($event)" />
            <button class="btn" type="button" [disabled]="!single()" (click)="addSingle()">
              <app-icon name="check" /> Block
            </button>
          </div>

          <h3 class="mt">Block a date range</h3>
          <div class="ctrl two">
            <app-date-picker [value]="start()" (valueChange)="start.set($event)" />
            <span class="to">→</span>
            <app-date-picker [value]="end()" (valueChange)="end.set($event)" [min]="start()" />
          </div>
          <button class="btn wide" type="button" [disabled]="!start() || !end()" (click)="addRange()">
            <app-icon name="check" /> Block range
          </button>

          <p class="note">
            Saved to <code>Busydates</code> with <code>type: "{{ type() }}"</code> — matching the
            original app's data contract.
          </p>
        </div>

        <div class="app-card pad">
          <div class="head">
            <h3>{{ type() }} — blocked days <span class="count">{{ dates().length }}</span></h3>
            @if (dates().length) {
              <button class="clear" type="button" (click)="clearType()"><app-icon name="x" /> Clear all</button>
            }
          </div>
          @if (dates().length === 0) {
            <div class="empty"><app-icon name="check-circle" /><p>No blocked {{ type() }} days.</p></div>
          } @else {
            <div class="chips">
              @for (d of dates(); track d.key) {
                <span class="chip">
                  {{ display(d.date) }}
                  <button type="button" (click)="del(d.key)" aria-label="Remove"><app-icon name="x" /></button>
                </span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .page { display: flex; flex-direction: column; gap: var(--gap); }
      .tabs { display: flex; gap: 8px; }
      .tab {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 16px;
        border-radius: var(--r-full);
        border: 1px solid var(--border);
        background: var(--bg-card);
        font-weight: 700;
        font-size: var(--fs-sm);
        color: var(--text);
      }
      .tab.on {
        background: var(--brand-navy);
        border-color: var(--brand-navy);
        color: #fff;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
        gap: var(--gap);
      }
      .pad { padding: 20px; }
      h3 { font-size: var(--fs-h2); color: var(--text-strong); margin-bottom: 12px; }
      .mt { margin-top: 22px; }
      .ctrl { display: flex; gap: 10px; align-items: center; }
      .ctrl.two { justify-content: space-between; }
      .to { color: var(--text-muted); }
      .ctrl app-date-picker {
        flex: 1 1 0;
        min-width: 0;
      }
      .btn {
        height: 46px;
        padding: 0 18px;
        border-radius: var(--r-md);
        background: var(--brand-red);
        color: #fff;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        white-space: nowrap;
      }
      .btn:hover:not(:disabled) { background: var(--brand-red-600); }
      .btn:disabled { opacity: 0.5; }
      .btn.wide { width: 100%; margin-top: 12px; justify-content: center; }
      .note { margin-top: 16px; font-size: var(--fs-sm); color: var(--text-muted); }
      code {
        font-family: ui-monospace, Menlo, monospace;
        font-size: 0.8rem;
        background: var(--bg-muted);
        padding: 1px 6px;
        border-radius: 5px;
      }
      .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .count {
        font-size: var(--fs-sm);
        font-weight: 800;
        color: var(--brand-red-600);
        background: color-mix(in srgb, var(--brand-red) 13%, transparent);
        padding: 1px 10px;
        border-radius: var(--r-full);
        margin-left: 6px;
      }
      .clear {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: var(--fs-sm);
        font-weight: 600;
        color: var(--brand-red-600);
      }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 8px 8px 13px;
        border-radius: var(--r-md);
        background: color-mix(in srgb, var(--brand-red) 9%, transparent);
        border: 1px solid color-mix(in srgb, var(--brand-red) 22%, transparent);
        color: var(--brand-red-600);
        font-weight: 600;
        font-size: var(--fs-sm);
      }
      .chip button {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        color: var(--brand-red-600);
        font-size: 13px;
      }
      .chip button:hover { background: color-mix(in srgb, var(--brand-red) 18%, transparent); }
      .empty { padding: 36px 20px; text-align: center; color: var(--text-muted); }
      .empty app-icon { font-size: 32px; color: var(--c-green); display: block; width: fit-content; margin: 0 auto 8px; }
      @media (max-width: 880px) {
        .grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class OfflineDaysComponent {
  private readonly data = inject(DataService);
  private readonly toast = inject(ToastService);

  protected readonly type = signal<DayType>('Home');
  protected readonly single = signal('');
  protected readonly start = signal('');
  protected readonly end = signal('');

  private readonly raw = toSignal(
    this.data.getData('Busydates').pipe(map((v) => (v ?? {}) as Record<string, BusyDate>)),
    { initialValue: {} as Record<string, BusyDate> },
  );

  protected readonly dates = computed<BusyDate[]>(() =>
    Object.entries(this.raw())
      .map(([key, v]) => ({ key, date: v?.date, type: v?.type }))
      .filter((d) => d.date && d.type === this.type())
      .sort((a, b) => a.date.localeCompare(b.date)),
  );

  protected addSingle(): void {
    const d = this.single();
    if (!d) return;
    try {
      this.data.push('Busydates', { date: d, type: this.type() });
      this.single.set('');
      this.toast.success(`Day blocked for ${this.type()}.`);
    } catch {
      this.toast.error('Could not save the day.');
    }
  }

  protected addRange(): void {
    const s = this.start();
    const e = this.end();
    if (!s || !e) return;
    const start = new Date(s);
    const end = new Date(e);
    let n = 0;
    try {
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        this.data.push('Busydates', { date: this.fmt(dt), type: this.type() });
        n++;
      }
      this.start.set('');
      this.end.set('');
      this.toast.success(`${n} day${n === 1 ? '' : 's'} blocked for ${this.type()}.`);
    } catch {
      this.toast.error('Could not save the date range.');
    }
  }

  protected del(key: string): void {
    this.data
      .remove('Busydates/' + key)
      .then(() => this.toast.success('Day removed.'))
      .catch(() => this.toast.error('Could not remove the day.'));
  }

  protected clearType(): void {
    const count = this.dates().length;
    Promise.all(this.dates().map((d) => this.data.remove('Busydates/' + d.key)))
      .then(() => this.toast.success(`Cleared ${count} ${this.type()} day${count === 1 ? '' : 's'}.`))
      .catch(() => this.toast.error('Could not clear all days.'));
  }

  protected display(date: string): string {
    const d = new Date(date);
    return isNaN(d.getTime())
      ? date
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  private fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
