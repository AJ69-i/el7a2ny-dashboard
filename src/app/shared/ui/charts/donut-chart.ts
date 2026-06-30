import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Arc extends DonutSegment {
  dash: string;
  rot: number;
  pct: number;
}

const R = 42;
const C = 2 * Math.PI * R;

@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut">
      <div class="ring">
        <svg viewBox="0 0 120 120" role="img" aria-label="Distribution chart">
          <circle class="track" cx="60" cy="60" [attr.r]="r" />
          @for (a of arcs(); track a.label) {
            <circle
              class="arc"
              cx="60"
              cy="60"
              [attr.r]="r"
              [attr.stroke]="a.color"
              [attr.stroke-dasharray]="a.dash"
              [attr.transform]="'rotate(' + a.rot + ' 60 60)'"
            />
          }
        </svg>
        <div class="center">
          <strong>{{ centerValue() || total() }}</strong>
          <span>{{ centerLabel() }}</span>
        </div>
      </div>

      <ul class="legend">
        @for (s of segments(); track s.label) {
          <li [class.clickable]="clickable()" (click)="pick(s)">
            <span class="dot" [style.background]="s.color"></span>
            <span class="lbl">{{ s.label }}</span>
            <span class="val">{{ s.value }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      .donut {
        display: flex;
        align-items: center;
        gap: clamp(14px, 3vw, 28px);
        flex-wrap: wrap;
        justify-content: center;
      }
      .ring {
        position: relative;
        width: clamp(140px, 16vw, 180px);
        flex: 0 0 auto;
      }
      svg {
        width: 100%;
        height: auto;
        transform: rotate(0);
      }
      .track {
        fill: none;
        stroke: var(--bg-muted);
        stroke-width: 14;
      }
      .arc {
        fill: none;
        stroke-width: 14;
        stroke-linecap: round;
        transition: stroke-dasharray 0.6s var(--ease);
      }
      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 1.1;
      }
      .center strong {
        font-size: 1.7rem;
        font-weight: 800;
        color: var(--text-strong);
      }
      .center span {
        font-size: var(--fs-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .legend {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 9px;
        flex: 1 1 130px;
        min-width: 130px;
      }
      .legend li {
        display: flex;
        align-items: center;
        gap: 9px;
        font-size: var(--fs-sm);
      }
      .legend li.clickable {
        cursor: pointer;
        padding: 3px 6px;
        margin: -3px -6px;
        border-radius: var(--r-sm);
        transition: background var(--t-fast);
      }
      .legend li.clickable:hover {
        background: color-mix(in srgb, var(--brand-red) 8%, transparent);
      }
      .dot {
        width: 11px;
        height: 11px;
        border-radius: 4px;
        flex: 0 0 auto;
      }
      .lbl {
        flex: 1;
        color: var(--text);
      }
      .val {
        font-weight: 700;
        color: var(--text-strong);
      }
    `,
  ],
})
export class DonutChartComponent {
  readonly segments = input<DonutSegment[]>([]);
  readonly centerLabel = input<string>('total');
  readonly centerValue = input<string | number>('');
  readonly clickable = input(false);
  readonly segClick = output<DonutSegment>();

  protected pick(s: DonutSegment): void {
    if (this.clickable()) this.segClick.emit(s);
  }

  protected readonly r = R;

  protected readonly total = computed(() =>
    this.segments().reduce((a, s) => a + s.value, 0),
  );

  protected readonly arcs = computed<Arc[]>(() => {
    const data = this.segments().filter((s) => s.value > 0);
    const total = data.reduce((a, s) => a + s.value, 0);
    if (!total) return [];
    let accAngle = 0;
    return data.map((s) => {
      const frac = s.value / total;
      const len = frac * C;
      const arc: Arc = {
        ...s,
        dash: `${len.toFixed(2)} ${(C - len).toFixed(2)}`,
        rot: accAngle - 90,
        pct: Math.round(frac * 100),
      };
      accAngle += frac * 360;
      return arc;
    });
  });
}
