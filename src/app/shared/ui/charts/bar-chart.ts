import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
}

interface Bar extends BarDatum {
  pct: number;
}

@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (bars().length === 0) {
      <p class="empty">No data yet.</p>
    } @else {
      <ul class="bars">
        @for (b of bars(); track b.label; let i = $index) {
          <li [class.clickable]="clickable()" (click)="pick(b)">
            <span class="lbl" [title]="b.label">{{ b.label }}</span>
            <span class="track">
              <span
                class="fill"
                [style.width.%]="b.pct"
                [style.background]="color()"
                [style.animation-delay.ms]="i * 60"
              ></span>
            </span>
            <span class="val">{{ b.value }}</span>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .bars {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 13px;
      }
      li {
        display: grid;
        grid-template-columns: minmax(70px, 28%) 1fr auto;
        align-items: center;
        gap: 12px;
        font-size: var(--fs-sm);
      }
      .lbl {
        color: var(--text);
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .track {
        height: 12px;
        border-radius: var(--r-full);
        background: var(--bg-muted);
        overflow: hidden;
      }
      .fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        transform-origin: left;
        animation: grow 0.6s var(--ease) both;
      }
      .val {
        font-weight: 700;
        color: var(--text-strong);
        min-width: 24px;
        text-align: right;
      }
      .empty {
        color: var(--text-muted);
        font-size: var(--fs-sm);
        padding: 12px 0;
      }
      li.clickable {
        cursor: pointer;
        border-radius: var(--r-sm);
        transition: background var(--t-fast);
      }
      li.clickable:hover {
        background: color-mix(in srgb, var(--brand-red) 7%, transparent);
      }
      li.clickable:hover .lbl {
        color: var(--brand-red);
      }
      @keyframes grow {
        from {
          transform: scaleX(0);
        }
      }
    `,
  ],
})
export class BarChartComponent {
  readonly data = input<BarDatum[]>([]);
  readonly color = input<string>('var(--brand-teal)');
  readonly max = input<number>(8);
  readonly clickable = input(false);
  readonly barClick = output<BarDatum>();

  protected pick(b: BarDatum): void {
    if (this.clickable()) this.barClick.emit({ label: b.label, value: b.value });
  }

  protected readonly bars = computed<Bar[]>(() => {
    const list = [...this.data()].sort((a, b) => b.value - a.value).slice(0, this.max());
    const top = Math.max(1, ...list.map((d) => d.value));
    return list.map((d) => ({ ...d, pct: Math.round((d.value / top) * 100) }));
  });
}
