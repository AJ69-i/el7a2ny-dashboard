import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ld" role="status" aria-live="polite">
      <span class="spin" aria-hidden="true"></span>
      <span class="lbl">{{ label() }}</span>
    </div>
  `,
  styles: [
    `
      .ld {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 48px 20px;
        color: var(--text-muted);
      }
      .spin {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid var(--border);
        border-top-color: var(--brand-red);
        animation: sp 0.7s linear infinite;
      }
      .lbl {
        font-size: var(--fs-sm);
      }
      @keyframes sp {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingComponent {
  readonly label = input('Loading…');
}
