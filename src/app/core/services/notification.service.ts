import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DataService } from '../../shared/services/data.service';
import { ToastService } from './toast.service';

export interface WatchTarget {
  node: string;
  label: string;
  /** Urgent targets (emergency) get an attention toast + a sound. */
  urgent?: boolean;
}

/**
 * Realtime cross-page alerting. Watches request nodes over Firebase RTDB
 * (websocket) and, when one grows, raises an in-app toast (rendered by the
 * always-mounted shell, so it appears on any route), an optional sound for
 * urgent targets, a browser notification, and keeps `counts/{node}/length` in
 * sync. Browser-only and idempotent.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly data = inject(DataService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  private started = false;
  private readonly baseline = new Map<string, number>();
  private audio: AudioContext | null = null;

  start(targets: WatchTarget[]): void {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    this.started = true;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    // Unlock the audio context on the first user interaction (autoplay policy).
    const prime = () => {
      this.ensureAudio();
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
    window.addEventListener('pointerdown', prime);
    window.addEventListener('keydown', prime);

    for (const t of targets) this.watch(t);
  }

  private watch(t: WatchTarget): void {
    this.data.getData(t.node).subscribe((value) => {
      const len = value && typeof value === 'object' ? Object.keys(value as object).length : 0;
      const prev = this.baseline.get(t.node);

      // First emission only establishes the baseline (no alert for existing records).
      if (prev === undefined) {
        this.baseline.set(t.node, len);
        return;
      }

      if (len > prev) {
        const added = len - prev;
        const msg =
          added > 1 ? `${added} new ${t.label} requests` : `New ${t.label} request`;

        if (t.urgent) {
          this.toast.alert(msg);
          this.beep();
        } else {
          this.toast.info(msg);
        }
        this.browserNotify(t.label, added);
        this.data.update(`counts/${t.node}`, { length: len }).catch(() => undefined);
      }

      this.baseline.set(t.node, len);
    });
  }

  private browserNotify(label: string, count: number): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const body = count > 1 ? `${count} new ${label} requests` : `New ${label} request`;
    const icon = new URL('logo.webp', document.baseURI).href; // base-relative (works under /REPO/)
    try {
      new Notification('El7a2ny', { body, icon, badge: icon });
    } catch {
      /* notifications unsupported / blocked — ignore */
    }
  }

  private ensureAudio(): void {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!this.audio) this.audio = new Ctx();
      if (this.audio && this.audio.state === 'suspended') this.audio.resume();
    } catch {
      /* audio unavailable — ignore */
    }
  }

  /** Short two-tone chime for urgent alerts (Web Audio, no asset needed). */
  private beep(): void {
    this.ensureAudio();
    const ctx = this.audio;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [880, 1175].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t0 = now + i * 0.18;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        osc.start(t0);
        osc.stop(t0 + 0.18);
      });
    } catch {
      /* ignore */
    }
  }
}
