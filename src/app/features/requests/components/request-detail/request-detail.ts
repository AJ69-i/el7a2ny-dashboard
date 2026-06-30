import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { EmergencyService } from '../../../../core/services/emergency.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  EMERGENCY_STATUSES,
  EmergencyStatus,
  IEmergencyView,
} from '../../../../shared/interfaces/emergency';
import { formatCoord, formatDateTime, initials, statusLabel, timeAgo } from '../../../../shared/utils/ui';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-request-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StatusBadgeComponent, RouterLink],
  template: `
    @if (request(); as r) {
      <div class="drawer-root">
        <button class="backdrop" type="button" (click)="close.emit()" aria-label="Close"></button>
        <aside class="panel" role="dialog" aria-label="Request details">
          <header class="head">
            <div class="who">
              <span class="avatar">{{ initials(r.name) }}</span>
              <div>
                <strong>{{ r.name }}</strong>
                <app-status-badge [status]="r.status" />
              </div>
            </div>
            <button class="icon-btn" type="button" (click)="close.emit()" aria-label="Close">
              <app-icon name="x" />
            </button>
          </header>

          <div class="body">
            <a class="contact" [href]="'tel:' + r.telephone">
              <span class="ci"><app-icon name="phone" /></span>
              <div>
                <span class="lbl">Phone</span>
                <strong>{{ r.telephone }}</strong>
              </div>
              <span class="call">Call</span>
            </a>

            <section class="block">
              <h4><app-icon name="car" /> Vehicle</h4>
              <dl>
                <div><dt>Model</dt><dd>{{ r.carModel }}</dd></div>
                <div><dt>Plate</dt><dd class="mono">{{ r.carPlateNumber }}</dd></div>
                <div><dt>VIN</dt><dd class="mono">{{ r.vin }}</dd></div>
              </dl>
            </section>

            <section class="block">
              <h4><app-icon name="pin" /> Location</h4>
              <dl>
                <div><dt>City</dt><dd>{{ r.city }}</dd></div>
                <div><dt>Area</dt><dd>{{ r.area }}</dd></div>
                <div><dt>Coords</dt><dd class="mono">{{ formatCoord(r.latitude, r.longitude) }}</dd></div>
              </dl>
              @if (mapUrl(); as url) {
                <iframe
                  class="mini-map"
                  [src]="url"
                  title="Location map"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
                <a class="ext" [href]="gmaps()" target="_blank" rel="noopener">
                  Open in Google Maps <app-icon name="external" />
                </a>
              }
            </section>

            <section class="block">
              <h4><app-icon name="clock" /> Timeline</h4>
              <dl>
                <div><dt>Reported</dt><dd>{{ formatDateTime(r.createdAt) }}</dd></div>
                <div><dt>Elapsed</dt><dd>{{ timeAgo(r.createdAt) }}</dd></div>
                @if (r.assignedTo) {
                  <div><dt>Assigned</dt><dd>{{ r.assignedTo }}</dd></div>
                }
                <div><dt>Request ID</dt><dd class="mono small">{{ r.key }}</dd></div>
              </dl>
            </section>
          </div>

          <footer class="foot">
            @if (r.userId && r.userId !== '—') {
              <a class="profile-link" [routerLink]="['/customer', r.userId]">
                <app-icon name="user" /> View full customer history
              </a>
            }
            <span class="foot-label">Update status</span>
            <div class="actions">
              @for (s of statuses; track s) {
                <button
                  type="button"
                  class="act"
                  [class.current]="r.status === s"
                  [style.--ac]="'var(--st-' + s + ')'"
                  [disabled]="r.status === s || busy() !== null"
                  (click)="setStatus(s)"
                >
                  @if (busy() === s) {
                    <span class="spin"></span>
                  } @else if (r.status === s) {
                    <app-icon name="check" />
                  }
                  {{ statusLabel(s) }}
                </button>
              }
            </div>
            @if (error()) {
              <p class="err"><app-icon name="alert" /> {{ error() }}</p>
            }
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
        background: rgba(6, 20, 37, 0.45);
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
      .icon-btn:hover {
        color: var(--brand-red);
        border-color: var(--brand-red-300);
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
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        margin-bottom: 10px;
      }
      .block h4 app-icon {
        font-size: 15px;
        color: var(--brand-teal);
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
      .small {
        font-size: 0.72rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      .mini-map {
        width: 100%;
        height: 170px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        margin-top: 12px;
      }
      .ext {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        font-size: var(--fs-sm);
        font-weight: 600;
        color: var(--brand-teal);
      }
      .ext app-icon {
        font-size: 14px;
      }
      .foot {
        padding: 16px 20px;
        border-top: 1px solid var(--border);
        background: var(--bg-app);
      }
      .foot-label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
      }
      .profile-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        font-weight: 700;
        font-size: var(--fs-sm);
        color: var(--brand-red-600);
      }
      .profile-link:hover {
        text-decoration: underline;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .act {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: var(--r-full);
        border: 1px solid var(--border);
        background: var(--bg-card);
        color: var(--ac);
        font-weight: 700;
        font-size: var(--fs-sm);
        transition: all var(--t-fast);
      }
      .act app-icon {
        font-size: 15px;
      }
      .act:not(:disabled):hover {
        background: var(--ac);
        border-color: var(--ac);
        color: #fff;
      }
      .act.current {
        background: var(--ac);
        border-color: var(--ac);
        color: #fff;
        opacity: 1;
      }
      .act:disabled:not(.current) {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .spin {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        border: 2px solid currentColor;
        border-top-color: transparent;
        animation: spin 0.7s linear infinite;
      }
      .err {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-sm);
        color: var(--c-danger);
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
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class RequestDetailComponent {
  private readonly em = inject(EmergencyService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);

  readonly request = input<IEmergencyView | null>(null);
  readonly close = output<void>();

  protected readonly statuses = EMERGENCY_STATUSES;
  protected readonly busy = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly initials = initials;
  protected readonly timeAgo = timeAgo;
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatCoord = formatCoord;
  protected readonly statusLabel = statusLabel;

  protected readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const r = this.request();
    if (!r || (!r.latitude && !r.longitude)) return null;
    const d = 0.008;
    const bbox = `${r.longitude - d},${r.latitude - d},${r.longitude + d},${r.latitude + d}`;
    const url =
      `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}` +
      `&layer=mapnik&marker=${r.latitude},${r.longitude}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected readonly gmaps = computed(() => {
    const r = this.request();
    return r ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}` : '#';
  });

  protected async setStatus(s: EmergencyStatus): Promise<void> {
    const r = this.request();
    if (!r) return;
    this.error.set(null);
    this.busy.set(s);
    try {
      await this.em.setStatus(r.key, s);
      this.toast.success('Status updated to ' + statusLabel(s) + '.');
    } catch (e) {
      this.error.set('Could not update status. Check Firebase write rules.');
      this.toast.error('Could not update status — check Firebase write rules.');
    } finally {
      this.busy.set(null);
    }
  }
}
