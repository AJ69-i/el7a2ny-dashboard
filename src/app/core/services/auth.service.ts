import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AUTH_BYPASS, AUTH_STORAGE_KEY, DEFAULT_OPERATOR_EMAIL, OPERATORS } from '../auth-config';
import { OPERATOR_PROFILES } from '../operator-profiles';

/**
 * Local, client-side authentication (no Firebase Auth required).
 * Validates an email + SHA-256(password) against the configured operators and
 * persists a lightweight session in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _email = signal<string | null>(this.restore());

  readonly isAuthenticated = computed(() => AUTH_BYPASS || this._email() !== null);
  readonly email = computed(() => this._email() ?? (AUTH_BYPASS ? DEFAULT_OPERATOR_EMAIL : ''));

  private readonly profile = computed(() => OPERATOR_PROFILES[this.email().toLowerCase()] ?? null);
  readonly displayName = computed(() => this.profile()?.name || this.email() || 'Operator');
  readonly role = computed(() => this.profile()?.role || 'Dispatch');
  readonly avatar = computed(() => this.profile()?.avatar || '');

  async signIn(email: string, password: string): Promise<void> {
    const e = email.trim().toLowerCase();
    const hash = await sha256(password);
    const ok = OPERATORS.some((o) => o.email.toLowerCase() === e && o.passwordHash === hash);
    if (!ok) throw new Error('invalid-credentials');
    this._email.set(email.trim());
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AUTH_STORAGE_KEY, email.trim());
    }
  }

  signOut(): void {
    this._email.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private restore(): string | null {
    if (AUTH_BYPASS || !isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }
}

/** SHA-256 hex digest via Web Crypto (available in browsers and Node 18+). */
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
