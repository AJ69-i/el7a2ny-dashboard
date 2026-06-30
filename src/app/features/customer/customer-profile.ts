import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { AggregateService, RequestKind, TaggedRecord } from '../../core/services/aggregate.service';
import { initials, formatDateTime, timeAgo } from '../../shared/utils/ui';
import { IconComponent } from '../../shared/ui/icon/icon';

const KIND_META: Record<RequestKind, { label: string; icon: string; color: string }> = {
  emergency: { label: 'Emergency', icon: 'shield', color: 'var(--st-new)' },
  maintenance: { label: 'Maintenance', icon: 'wrench', color: 'var(--brand-red)' },
  amendment: { label: 'Amendment', icon: 'edit', color: 'var(--c-amber)' },
};

@Component({
  selector: 'app-customer-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <a class="back" [routerLink]="['/', 'customers']"><app-icon name="chevron-left" /> Customers</a>

    @if (profile(); as p) {
      <div class="grid">
        <aside class="app-card who">
          <span class="avatar">{{ ini(p.name || '?') }}</span>
          <h2>{{ p.name || '—' }}</h2>
          @if (isVip()) {
            <span class="vip"><app-icon name="star" /> VIP customer</span>
          }
          <a class="call" [href]="'tel:' + p.telephone">{{ p.telephone || '—' }}</a>
          <dl>
            <div><dt>Car</dt><dd>{{ p.carModel || '—' }}</dd></div>
            <div><dt>Plate</dt><dd class="mono">{{ p.carPlateNumber || '—' }}</dd></div>
            <div><dt>VIN</dt><dd class="mono">{{ p.vin || '—' }}</dd></div>
            <div><dt>City</dt><dd>{{ p.cityName || '—' }}</dd></div>
            <div><dt>Area</dt><dd>{{ p.area || '—' }}</dd></div>
            <div><dt>ID</dt><dd class="mono small">{{ p.id || '—' }}</dd></div>
          </dl>
        </aside>

        <div class="main">
          <div class="stats">
            <div class="app-card stat"><span class="v">{{ requests().length }}</span><span class="l">Total requests</span></div>
            <div class="app-card stat"><span class="v">{{ byKind().emergency }}</span><span class="l">Emergencies</span></div>
            <div class="app-card stat"><span class="v">{{ byKind().maintenance }}</span><span class="l">Maintenance</span></div>
            <div class="app-card stat"><span class="v">{{ byKind().amendment }}</span><span class="l">Amendments</span></div>
            <div class="app-card stat accent"><span class="v">{{ tuningSpendLabel() }}</span><span class="l">Tuning spend (EGP)</span></div>
          </div>

          <div class="app-card timeline">
            <h3>Activity</h3>
            @if (requests().length === 0) {
              <p class="empty">No requests on record for this customer.</p>
            } @else {
              <ul>
                @for (r of requests(); track $index) {
                  <li>
                    <span class="dot" [style.background]="meta(r).color"><app-icon [name]="meta(r).icon" /></span>
                    <div class="body">
                      <div class="row1">
                        <strong>{{ meta(r).label }}</strong>
                        <span class="badge" [class.arch]="r.archived">{{ r.archived ? 'Archived' : 'Active' }}</span>
                      </div>
                      <p class="detail">{{ detail(r) }}</p>
                    </div>
                    <span class="when" [title]="fmt(r.createdAt)">{{ ago(r.createdAt) }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="app-card notfound">
        <app-icon name="alert" />
        <p>No customer found for this ID.</p>
      </div>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        font-size: var(--fs-sm);
        color: var(--text-muted);
        margin-bottom: var(--gap);
      }
      .back:hover { color: var(--brand-red); }
      .grid {
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr);
        gap: var(--gap);
        align-items: start;
      }
      .who {
        padding: 24px 20px;
        text-align: center;
      }
      .avatar {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        margin: 0 auto 12px;
        display: grid;
        place-items: center;
        font-size: 1.6rem;
        font-weight: 800;
        color: #fff;
        background: var(--grad-navy);
      }
      .who h2 { font-size: 1.25rem; color: var(--text-strong); }
      .vip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 8px;
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--c-amber);
        background: color-mix(in srgb, var(--c-amber) 14%, transparent);
        padding: 4px 12px;
        border-radius: var(--r-full);
      }
      .call {
        display: block;
        margin: 12px 0 18px;
        font-weight: 700;
        color: var(--brand-red);
      }
      .who dl { margin: 0; display: grid; gap: 10px; text-align: left; }
      .who dl > div { display: flex; justify-content: space-between; gap: 12px; font-size: var(--fs-sm); }
      dt { color: var(--text-muted); }
      dd { margin: 0; color: var(--text-strong); font-weight: 600; text-align: right; word-break: break-word; }
      .mono { font-family: ui-monospace, Menlo, monospace; font-size: 0.8rem; }
      .small { font-size: 0.7rem; color: var(--text-muted); }
      .main { display: flex; flex-direction: column; gap: var(--gap); min-width: 0; }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: var(--gap);
      }
      .stat { padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
      .stat .v { font-size: 1.6rem; font-weight: 800; color: var(--text-strong); }
      .stat .l { font-size: var(--fs-xs); color: var(--text-muted); }
      .stat.accent { background: var(--grad-red); }
      .stat.accent .v, .stat.accent .l { color: #fff; }
      .timeline { padding: 20px; }
      .timeline h3 { font-size: var(--fs-h2); color: var(--text-strong); margin-bottom: 14px; }
      .timeline ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
      .timeline li {
        display: flex;
        gap: 14px;
        padding: 14px 0;
        border-top: 1px solid var(--border);
      }
      .timeline li:first-child { border-top: none; }
      .dot {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        color: #fff;
        font-size: 18px;
      }
      .body { flex: 1; min-width: 0; }
      .row1 { display: flex; align-items: center; gap: 10px; }
      .row1 strong { color: var(--text-strong); }
      .badge {
        font-size: var(--fs-xs);
        font-weight: 700;
        padding: 2px 9px;
        border-radius: var(--r-full);
        color: var(--c-green);
        background: color-mix(in srgb, var(--c-green) 14%, transparent);
      }
      .badge.arch { color: var(--text-muted); background: var(--bg-muted); }
      .detail { font-size: var(--fs-sm); color: var(--text-muted); margin-top: 3px; }
      .when { font-size: var(--fs-xs); color: var(--text-muted); white-space: nowrap; }
      .empty { color: var(--text-muted); }
      .notfound { padding: 48px; text-align: center; color: var(--text-muted); }
      .notfound app-icon { font-size: 34px; color: var(--c-warning); display: block; width: fit-content; margin: 0 auto 10px; }
      @media (max-width: 880px) {
        .grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class CustomerProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly agg = inject(AggregateService);

  protected readonly ini = initials;
  protected readonly fmt = formatDateTime;
  protected readonly ago = timeAgo;

  private readonly idVal = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('id') ?? '' },
  );

  protected readonly requests = computed(() => this.agg.requestsForUser(this.idVal()));
  protected readonly isVip = computed(() => this.agg.isVip(this.idVal()));

  protected readonly profile = computed(() => {
    const c = this.agg.customerById(this.idVal());
    if (c) return c;
    const reqs = this.requests();
    return reqs.length ? reqs[0] : null;
  });

  protected readonly byKind = computed(() => {
    const acc = { emergency: 0, maintenance: 0, amendment: 0 } as Record<RequestKind, number>;
    for (const r of this.requests()) acc[r.kind]++;
    return acc;
  });

  protected readonly tuningSpend = computed(() =>
    this.requests()
      .filter((r) => r.kind === 'amendment')
      .reduce((sum, r) => sum + (Number(r.budge) || 0), 0),
  );
  protected readonly tuningSpendLabel = computed(() => this.tuningSpend().toLocaleString());

  protected meta(r: TaggedRecord) {
    return KIND_META[r.kind];
  }

  protected detail(r: TaggedRecord): string {
    if (r.kind === 'emergency') return `${r.cityName || '—'}, ${r.area || '—'}`;
    if (r.kind === 'maintenance')
      return [r.requestType, r.problem].filter(Boolean).join(' · ') || '—';
    return [r.budge ? `${r.budge} EGP` : '', r.describition].filter(Boolean).join(' · ') || '—';
  }
}
