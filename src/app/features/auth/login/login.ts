import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="screen">
      <form class="box" (submit)="submit(); $event.preventDefault()">
        <img class="logo" [src]="logoSrc()" (error)="onLogoError()" alt="El7a2ny" />
        <h1>Operator sign in</h1>
        <p class="sub">Emergency, Tuning &amp; Car Services</p>

        <label class="field">
          <span>Email</span>
          <input
            type="email"
            autocomplete="username"
            placeholder="you@el7a2ny.com"
            [value]="email()"
            (input)="email.set($any($event.target).value)"
          />
        </label>

        <label class="field">
          <span>Password</span>
          <span class="pw">
            <input
              [type]="show() ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              [value]="password()"
              (input)="password.set($any($event.target).value)"
            />
            <button type="button" class="eye" (click)="show.set(!show())" aria-label="Toggle password">
              <app-icon [name]="show() ? 'x-circle' : 'check-circle'" />
            </button>
          </span>
        </label>

        @if (error()) {
          <p class="err"><app-icon name="alert" /> {{ error() }}</p>
        }

        <button class="submit" type="submit" [disabled]="busy()">
          @if (busy()) {
            <span class="spin"></span> Signing in…
          } @else {
            Sign in
          }
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .screen {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: linear-gradient(135deg, var(--brand-red-300) 0%, var(--brand-red) 55%, var(--brand-red-600) 100%);
      }
      .box {
        width: min(390px, 100%);
        background: var(--bg-card);
        border-radius: var(--r-xl);
        box-shadow: var(--shadow-lg);
        padding: 34px 30px;
        text-align: center;
      }
      .logo {
        width: 170px;
        height: auto;
        margin: 0 auto 10px;
      }
      h1 {
        font-size: 1.3rem;
        color: var(--text-strong);
      }
      .sub {
        font-size: var(--fs-sm);
        color: var(--text-muted);
        margin-bottom: 22px;
      }
      .field {
        display: block;
        text-align: left;
        margin-bottom: 14px;
      }
      .field > span {
        display: block;
        font-size: var(--fs-sm);
        font-weight: 600;
        color: var(--text-muted);
        margin-bottom: 6px;
      }
      .field input {
        width: 100%;
        height: 46px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        padding: 0 14px;
        font: inherit;
        color: var(--text-strong);
        background: var(--bg-app);
        outline: none;
      }
      .field input:focus {
        border-color: var(--brand-red);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-red) 18%, transparent);
      }
      .pw {
        position: relative;
        display: block;
      }
      .eye {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        color: var(--text-muted);
        font-size: 18px;
      }
      .err {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
        color: var(--c-danger);
        margin-bottom: 12px;
        text-align: left;
      }
      .submit {
        width: 100%;
        height: 48px;
        border-radius: var(--r-md);
        background: var(--brand-red);
        color: #fff;
        font-weight: 700;
        font-size: var(--fs-body);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .submit:hover:not(:disabled) {
        background: var(--brand-red-600);
      }
      .submit:disabled {
        opacity: 0.7;
      }
      .spin {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.5);
        border-top-color: #fff;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly show = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly logoSrc = signal('/logo.webp');

  protected onLogoError(): void {
    const hosted = 'https://aj69-i.github.io/El7a2ny/assets/img/logo.webp';
    if (this.logoSrc() !== hosted) this.logoSrc.set(hosted);
  }

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  protected async submit(): Promise<void> {
    if (!this.email() || !this.password()) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.signIn(this.email().trim(), this.password());
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.error.set('Incorrect email or password.');
    } finally {
      this.busy.set(false);
    }
  }
}
