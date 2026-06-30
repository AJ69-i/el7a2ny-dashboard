import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface AreaPoint {
  label: string;
  value: number;
}

const W = 300;
const H = 100;
const TOP = 12;
const BOT = 92;

@Component({
  selector: 'app-area-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="area">
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" class="svg" role="img" aria-label="Trend over time">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" [attr.stop-color]="color()" stop-opacity="0.32" />
            <stop offset="1" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line class="base" x1="0" [attr.y1]="bot" x2="300" [attr.y2]="bot" />
        @if (areaPath()) {
          <path class="fill" [attr.d]="areaPath()" [attr.fill]="'url(#' + gid + ')'" />
          <path class="line" [attr.d]="linePath()" [attr.stroke]="color()" />
        }
      </svg>
      <div class="xlabels">
        @for (l of xLabels(); track $index) {
          <span>{{ l }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .area {
        width: 100%;
      }
      .svg {
        width: 100%;
        height: 150px;
        display: block;
        overflow: visible;
      }
      .base {
        stroke: var(--border);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .line {
        fill: none;
        stroke-width: 2.5;
        stroke-linejoin: round;
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
      }
      .fill {
        stroke: none;
      }
      .xlabels {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: var(--fs-xs);
        color: var(--text-muted);
      }
    `,
  ],
})
export class AreaChartComponent {
  private static seq = 0;

  readonly data = input<AreaPoint[]>([]);
  readonly color = input<string>('var(--brand-red)');

  protected readonly bot = BOT;
  protected readonly gid = 'area-grad-' + AreaChartComponent.seq++;

  private readonly coords = computed(() => {
    const d = this.data();
    const n = d.length;
    if (n === 0) return [] as { x: number; y: number }[];
    const max = Math.max(1, ...d.map((p) => p.value));
    return d.map((p, i) => ({
      x: n === 1 ? W / 2 : (i / (n - 1)) * W,
      y: BOT - (p.value / max) * (BOT - TOP),
    }));
  });

  protected readonly linePath = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    return c.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  });

  protected readonly areaPath = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    const first = c[0];
    const last = c[c.length - 1];
    return (
      `M${first.x.toFixed(1)} ${BOT} ` +
      c.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
      ` L${last.x.toFixed(1)} ${BOT} Z`
    );
  });

  protected readonly xLabels = computed(() => {
    const d = this.data();
    if (d.length <= 1) return d.map((p) => p.label);
    const idxs = [0, Math.round((d.length - 1) * 0.33), Math.round((d.length - 1) * 0.66), d.length - 1];
    return [...new Set(idxs)].map((i) => d[i].label);
  });
}
