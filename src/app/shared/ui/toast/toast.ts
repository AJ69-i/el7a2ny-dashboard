import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="wrap" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.type">
          <app-icon [name]="icon(t.type)" />
          <span class="msg">{{ t.text }}</span>
          <button type="button" (click)="toast.dismiss(t.id)" aria-label="Dismiss">
            <app-icon name="x" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .wrap {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: min(360px, calc(100vw - 36px));
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: var(--r-md);
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-left: 4px solid var(--c);
        box-shadow: var(--shadow-lg);
        font-size: var(--fs-sm);
        color: var(--text-strong);
        animation: slide-in 0.22s var(--ease);
      }
      .toast app-icon {
        font-size: 18px;
        color: var(--c);
        flex: 0 0 auto;
      }
      .msg {
        flex: 1;
      }
      .toast button {
        color: var(--text-muted);
        font-size: 15px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }
      .toast button:hover {
        color: var(--text-strong);
      }
      .success {
        --c: var(--c-green);
      }
      .error {
        --c: var(--c-danger);
      }
      .info {
        --c: var(--brand-teal);
      }
      .alert {
        --c: var(--brand-red);
      }
      .alert app-icon {
        animation: bell-shake 0.9s var(--ease) 1;
      }
      @keyframes bell-shake {
        0%, 100% { transform: rotate(0); }
        20% { transform: rotate(-14deg); }
        40% { transform: rotate(11deg); }
        60% { transform: rotate(-7deg); }
        80% { transform: rotate(4deg); }
      }
      @keyframes slide-in {
        from {
          transform: translateY(10px);
          opacity: 0;
        }
      }
    `,
  ],
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);

  protected icon(t: ToastType): string {
    return t === 'success'
      ? 'check-circle'
      : t === 'error'
        ? 'x-circle'
        : t === 'alert'
          ? 'alert'
          : 'bell';
  }
}
