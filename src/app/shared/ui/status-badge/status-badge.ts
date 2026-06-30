import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EmergencyStatus } from '../../interfaces/emergency';
import { statusColor, statusLabel } from '../../utils/ui';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status-badge" [style.color]="color()" [style.background]="bg()">
      <span class="dot"></span>{{ label() }}
    </span>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        letter-spacing: 0.01em;
        padding: 4px 10px 4px 9px;
        border-radius: var(--r-full);
        white-space: nowrap;
      }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent);
      }
    `,
  ],
})
export class StatusBadgeComponent {
  readonly status = input.required<EmergencyStatus>();

  protected readonly color = computed(() => statusColor(this.status()));
  protected readonly bg = computed(
    () => `color-mix(in srgb, ${statusColor(this.status())} 13%, transparent)`,
  );
  protected readonly label = computed(() => statusLabel(this.status()));
}
