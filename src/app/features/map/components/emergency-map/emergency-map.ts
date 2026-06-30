import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { EmergencyStatus, IEmergencyView, STATUS_LABEL } from '../../../../shared/interfaces/emergency';

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const EGYPT_CENTER: [number, number] = [26.82, 30.8]; // fallback view

@Component({
  selector: 'app-emergency-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-wrap" [style.height]="height()">
      <div #mapEl class="map" [class.hidden]="failed()"></div>

      @if (failed()) {
        <div class="fallback">
          <strong>Map unavailable</strong>
          <p>Couldn't load the map tiles. {{ points().length }} location(s) pending.</p>
        </div>
      }

      <div class="legend">
        @for (s of legend; track s.key) {
          <span class="li"><i [style.background]="s.color"></i>{{ s.label }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .map-wrap {
        position: relative;
        width: 100%;
        border-radius: var(--r-lg);
        overflow: hidden;
        border: 1px solid var(--border);
        background: var(--bg-muted);
      }
      .map {
        position: absolute;
        inset: 0;
        z-index: 1;
      }
      .map.hidden {
        display: none;
      }
      .fallback {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        text-align: center;
        color: var(--text-muted);
        padding: 20px;
      }
      .fallback strong {
        color: var(--text-strong);
      }
      .legend {
        position: absolute;
        left: 12px;
        bottom: 12px;
        z-index: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 8px 12px;
        border-radius: var(--r-md);
        background: var(--topbar-bg);
        backdrop-filter: blur(8px);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
        font-size: var(--fs-xs);
        font-weight: 600;
        color: var(--text);
      }
      .li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .li i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
    `,
  ],
})
export class EmergencyMapComponent {
  readonly points = input<IEmergencyView[]>([]);
  readonly height = input<string>('440px');
  readonly select = output<IEmergencyView>();

  protected readonly failed = signal(false);
  protected readonly mapEl = viewChild<ElementRef<HTMLDivElement>>('mapEl');

  protected readonly legend = (Object.keys(STATUS_LABEL) as EmergencyStatus[]).map((key) => ({
    key,
    label: STATUS_LABEL[key],
    color: `var(--st-${key})`,
  }));

  private L: any = null;
  private map: any = null;
  private layer: any = null;
  private ready = false;

  constructor() {
    afterNextRender(() => this.init());

    // Re-render markers whenever the data changes (after the map is ready).
    effect(() => {
      const pts = this.points();
      if (this.ready) this.renderMarkers(pts);
    });
  }

  private async init(): Promise<void> {
    const el = this.mapEl()?.nativeElement;
    if (!el) return;
    try {
      const L = await this.loadLeaflet();
      this.L = L;
      this.map = L.map(el, { zoomControl: true, attributionControl: true }).setView(
        EGYPT_CENTER,
        6,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
      this.ready = true;
      setTimeout(() => this.map?.invalidateSize(), 120);
      this.renderMarkers(this.points());
    } catch {
      this.failed.set(true);
    }
  }

  private renderMarkers(points: IEmergencyView[]): void {
    if (!this.ready || !this.L || !this.layer) return;
    const L = this.L;
    this.layer.clearLayers();

    const valid = points.filter((p) => p.latitude && p.longitude);
    const latlngs: [number, number][] = [];

    for (const p of valid) {
      const color = `var(--st-${p.status})`;
      const icon = L.divIcon({
        className: 'em-pin',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        html:
          `<span style="display:block;width:16px;height:16px;border-radius:50%;` +
          `background:${color};border:2.5px solid #fff;` +
          `box-shadow:0 0 0 2px color-mix(in srgb, ${color} 55%, transparent),0 2px 5px rgba(0,0,0,.35)"></span>`,
      });
      const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(this.layer);
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:150px">` +
          `<strong style="font-size:14px">${escapeHtml(p.name)}</strong><br>` +
          `<span style="color:#64748b">${escapeHtml(p.carModel)} · ${escapeHtml(p.carPlateNumber)}</span><br>` +
          `<span style="color:#64748b">${escapeHtml(p.city)}, ${escapeHtml(p.area)}</span><br>` +
          `<span style="display:inline-block;margin-top:4px;font-weight:700;color:${color}">${STATUS_LABEL[p.status]}</span>` +
          `</div>`,
      );
      marker.on('click', () => this.select.emit(p));
      latlngs.push([p.latitude, p.longitude]);
    }

    if (latlngs.length === 1) {
      this.map.setView(latlngs[0], 13);
    } else if (latlngs.length > 1) {
      this.map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 14 });
    }
  }

  private loadLeaflet(): Promise<any> {
    const w = window as any;
    if (w.L) return Promise.resolve(w.L);

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    return new Promise((resolve, reject) => {
      const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
      if (existing) {
        if (w.L) return resolve(w.L);
        existing.addEventListener('load', () => resolve((window as any).L));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = () => resolve((window as any).L);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(s).replace(/[&<>"']/g, (c) => map[c]);
}
