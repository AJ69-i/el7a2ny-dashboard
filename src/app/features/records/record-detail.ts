import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { FlatRecord } from '../../shared/interfaces/record';
import { initials } from '../../shared/utils/ui';
import { IconComponent } from '../../shared/ui/icon/icon';

interface Field {
  label: string;
  value: string;
  mono?: boolean;
}

@Component({
  selector: 'app-record-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RouterLink],
  template: `
    @if (record(); as r) {
      <div>
        <button class="backdrop" type="button" (click)="close.emit()" aria-label="Close"></button>
        <aside class="panel" role="dialog" aria-label="Record details">
          <header class="head">
            <div class="who">
              <span class="avatar">{{ ini(r.name || '?') }}</span>
              <div>
                <strong>{{ r.name || '—' }}</strong>
                @if (r.status) {
                  <span class="badge">{{ r.status }}</span>
                }
              </div>
            </div>
            <button class="icon-btn" type="button" (click)="close.emit()" aria-label="Close">
              <app-icon name="x" />
            </button>
          </header>

          <div class="body">
            @if (r.telephone) {
              <a class="contact" [href]="'tel:' + r.telephone">
                <span class="ci"><app-icon name="phone" /></span>
                <div><span class="lbl">Phone</span><strong>{{ r.telephone }}</strong></div>
                <span class="call">Call</span>
              </a>
            }

            <section class="block">
              <h4>Details</h4>
              <dl>
                @for (f of fields(); track f.label) {
                  <div>
                    <dt>{{ f.label }}</dt>
                    <dd [class.mono]="f.mono">{{ f.value }}</dd>
                  </div>
                }
              </dl>
              @if (mapUrl(); as url) {
                <iframe
                  class="mini-map"
                  [src]="url"
                  title="Location"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
              }
            </section>
          </div>

          <footer class="foot">
            @if (r.id) {
              <a class="profile-link" [routerLink]="['/customer', r.id]">
                <app-icon name="user" /> View full history
              </a>
            }
            <button class="primary" type="button" (click)="act.emit()">
              {{ actionLabel() }}
            </button>
          </footer>
        </aside>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 90;
        border: none;
        background: rgba(13, 13, 16, 0.45);
        backdrop-filter: blur(2px);
        animation: fade var(--t) var(--ease);
      }
      .panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 95;
        width: min(440px, 100vw);
        display: flex;
        flex-direction: column;
        background: var(--bg-card);
        border-left: 1px solid var(--border);
        box-shadow: var(--shadow-lg);
        animation: slide var(--t) var(--ease);
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px;
        border-bottom: 1px solid var(--border);
      }
      .who {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .who > div {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .who strong {
        font-size: 1.05rem;
        color: var(--text-strong);
      }
      .avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        color: #fff;
        background: var(--grad-navy);
      }
      .badge {
        align-self: flex-start;
        font-size: var(--fs-xs);
        font-weight: 700;
        padding: 3px 10px;
        border-radius: var(--r-full);
        color: var(--brand-red-600);
        background: color-mix(in srgb, var(--brand-red) 13%, transparent);
        text-transform: capitalize;
      }
      .icon-btn {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        font-size: 18px;
        color: var(--text);
        border: 1px solid var(--border);
        background: var(--bg-card);
      }
      .body {
        flex: 1;
        overflow-y: auto;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .contact {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 14px;
        border-radius: var(--r-md);
        background: var(--grad-navy);
        color: #fff;
      }
      .contact .ci {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        font-size: 18px;
        background: rgba(255, 255, 255, 0.16);
      }
      .contact .lbl {
        font-size: var(--fs-xs);
        color: rgba(255, 255, 255, 0.7);
        display: block;
      }
      .contact strong {
        font-size: 1rem;
      }
      .contact .call {
        margin-left: auto;
        font-weight: 700;
        font-size: var(--fs-sm);
        background: var(--brand-red);
        padding: 7px 14px;
        border-radius: var(--r-full);
      }
      .block h4 {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        margin-bottom: 10px;
      }
      dl {
        margin: 0;
        display: grid;
        gap: 9px;
      }
      dl > div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: var(--fs-sm);
      }
      dt {
        color: var(--text-muted);
      }
      dd {
        margin: 0;
        color: var(--text-strong);
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }
      .mono {
        font-family: ui-monospace, Menlo, monospace;
        font-size: 0.8rem;
      }
      .mini-map {
        width: 100%;
        height: 160px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        margin-top: 12px;
      }
      .foot {
        padding: 16px 20px;
        border-top: 1px solid var(--border);
        background: var(--bg-app);
      }
      .primary {
        width: 100%;
        height: 46px;
        border-radius: var(--r-md);
        background: var(--brand-red);
        color: #fff;
        font-weight: 700;
        font-size: var(--fs-body);
      }
      .primary:hover {
        background: var(--brand-red-600);
      }
      .profile-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-bottom: 10px;
        font-weight: 700;
        font-size: var(--fs-sm);
        color: var(--brand-red-600);
      }
      .profile-link:hover {
        text-decoration: underline;
      }
      @keyframes slide {
        from {
          transform: translateX(100%);
        }
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
    `,
  ],
})
export class RecordDetailComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly record = input<FlatRecord | null>(null);
  readonly actionLabel = input<string>('Done');
  readonly close = output<void>();
  readonly act = output<void>();

  protected readonly ini = initials;

  protected readonly fields = computed<Field[]>(() => {
    const r = this.record();
    if (!r) return [];
    const defs: { label: string; key: keyof FlatRecord; mono?: boolean }[] = [
      { label: 'Customer ID', key: 'id', mono: true },
      { label: 'Car model', key: 'carModel' },
      { label: 'Plate', key: 'carPlateNumber', mono: true },
      { label: 'VIN', key: 'vin', mono: true },
      { label: 'City', key: 'cityName' },
      { label: 'Area', key: 'area' },
      { label: 'Date', key: 'date' },
      { label: 'Service type', key: 'requestType' },
      { label: 'Problem', key: 'problem' },
      { label: 'Budget', key: 'budge' },
      { label: 'Description', key: 'describition' },
    ];
    const out = defs
      .filter((d) => r[d.key] !== undefined && r[d.key] !== null && r[d.key] !== '')
      .map((d) => ({ label: d.label, value: String(r[d.key]), mono: d.mono }));
    if (r.latitude && r.longitude) {
      out.push({ label: 'Coords', value: `${r.latitude}, ${r.longitude}`, mono: true });
    }
    return out;
  });

  protected readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const r = this.record();
    if (!r || !r.latitude || !r.longitude) return null;
    const d = 0.008;
    const bbox = `${r.longitude - d},${r.latitude - d},${r.longitude + d},${r.latitude + d}`;
    const url =
      `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}` +
      `&layer=mapnik&marker=${r.latitude},${r.longitude}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });
}
