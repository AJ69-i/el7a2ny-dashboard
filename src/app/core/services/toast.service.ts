import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ToastType = 'success' | 'error' | 'info' | 'alert';
export interface Toast {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, text: string, ms = 4000): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, type, text }]);
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.dismiss(id), ms);
    }
  }

  success(text: string): void {
    this.show('success', text);
  }
  error(text: string): void {
    this.show('error', text, 6000);
  }
  info(text: string): void {
    this.show('info', text);
  }
  alert(text: string): void {
    this.show('alert', text, 8000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
