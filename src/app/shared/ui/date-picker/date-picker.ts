import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon';

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

interface DayCell {
  date: Date;
  n: number;
  t: number;
  other: boolean;
  today: boolean;
  sel: boolean;
  disabled: boolean;
}

/** Lightweight, dependency-free, brand-themed date picker. Emits `YYYY-MM-DD`. */
@Component({
  selector: 'app-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="dp">
      <button type="button" class="trigger" [class.placeholder]="!value()" (click)="toggle()">
        <span>{{ display() }}</span>
        <app-icon name="calendar" />
      </button>

      @if (open()) {
        <div class="pop" role="dialog" aria-label="Choose date">
          <div class="head">
            <button type="button" class="nav" (click)="prevMonth()" aria-label="Previous month">
              <app-icon name="chevron-left" />
            </button>
            <strong>{{ monthLabel() }}</strong>
            <button type="button" class="nav" (click)="nextMonth()" aria-label="Next month">
              <app-icon name="chevron-right" />
            </button>
          </div>

          <div class="dow">
            @for (d of dow; track d) {
              <span>{{ d }}</span>
            }
          </div>

          <div class="grid">
            @for (c of days(); track c.t) {
              <button
                type="button"
                class="day"
                [class.other]="c.other"
                [class.today]="c.today"
                [class.sel]="c.sel"
                [disabled]="c.disabled"
                (click)="pick(c.date)"
              >
                {{ c.n }}
              </button>
            }
          </div>

          <div class="foot">
            <button type="button" (click)="clear()">Clear</button>
            <button type="button" (click)="today()">Today</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .dp {
        position: relative;
      }
      .trigger {
        width: 100%;
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--bg-app);
        color: var(--text-strong);
        font: inherit;
        cursor: pointer;
      }
      .trigger.placeholder {
        color: var(--text-muted);
      }
      .trigger app-icon {
        font-size: 18px;
        color: var(--text-muted);
        flex: 0 0 auto;
      }
      .trigger:hover {
        border-color: var(--brand-red-300);
      }
      .pop {
        position: absolute;
        z-index: 50;
        top: calc(100% + 6px);
        left: 0;
        width: 270px;
        max-width: 84vw;
        padding: 12px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-lg);
        animation: dp-in 0.16s var(--ease);
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .head strong {
        font-size: var(--fs-sm);
        color: var(--text-strong);
      }
      .nav {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        color: var(--text);
        font-size: 16px;
      }
      .nav:hover {
        background: var(--bg-muted);
        color: var(--brand-red);
      }
      .dow {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: 4px;
      }
      .dow span {
        text-align: center;
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--text-muted);
        padding: 4px 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .day {
        height: 34px;
        border-radius: 9px;
        font: inherit;
        font-size: 0.85rem;
        color: var(--text-strong);
        background: none;
      }
      .day:hover:not(:disabled) {
        background: color-mix(in srgb, var(--brand-red) 12%, transparent);
        color: var(--brand-red-600);
      }
      .day.other {
        color: var(--text-muted);
        opacity: 0.55;
      }
      .day.today {
        box-shadow: inset 0 0 0 1px var(--brand-red-300);
      }
      .day.sel {
        background: var(--brand-red);
        color: #fff;
        font-weight: 700;
      }
      .day:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .foot {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--border);
      }
      .foot button {
        font-size: var(--fs-sm);
        font-weight: 700;
        color: var(--brand-red-600);
      }
      .foot button:hover {
        text-decoration: underline;
      }
      @keyframes dp-in {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
      }
    `,
  ],
})
export class DatePickerComponent {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  readonly value = input<string>('');
  readonly placeholder = input('dd/mm/yyyy');
  readonly min = input<string>('');
  readonly valueChange = output<string>();

  protected readonly open = signal(false);
  protected readonly viewMonth = signal<Date>(this.startMonth());
  protected readonly dow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  protected readonly display = computed(() => {
    const d = parseISO(this.value());
    return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : this.placeholder();
  });

  protected readonly monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );

  protected readonly days = computed<DayCell[]>(() => {
    const vm = this.viewMonth();
    const sel = parseISO(this.value());
    const selISO = sel ? toISO(sel) : '';
    const min = parseISO(this.min());
    const minTime = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime() : null;
    const todayISO = toISO(new Date());

    const first = new Date(vm.getFullYear(), vm.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const iso = toISO(dt);
      cells.push({
        date: dt,
        n: dt.getDate(),
        t: dt.getTime(),
        other: dt.getMonth() !== vm.getMonth(),
        today: iso === todayISO,
        sel: !!selISO && iso === selISO,
        disabled: minTime !== null && dt.getTime() < minTime,
      });
    }
    return cells;
  });

  private startMonth(): Date {
    const d = parseISO(this.value()) ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  protected toggle(): void {
    if (!this.open()) this.viewMonth.set(this.startMonth());
    this.open.update((o) => !o);
  }

  protected prevMonth(): void {
    const v = this.viewMonth();
    this.viewMonth.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const v = this.viewMonth();
    this.viewMonth.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }

  protected pick(d: Date): void {
    this.valueChange.emit(toISO(d));
    this.open.set(false);
  }

  protected today(): void {
    this.pick(new Date());
  }

  protected clear(): void {
    this.valueChange.emit('');
    this.open.set(false);
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
