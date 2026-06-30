import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

import { DataService } from '../../shared/services/data.service';
import {
  EMERGENCY_STATUSES,
  EmergencyStatus,
  IEmergency,
  IEmergencyView,
} from '../../shared/interfaces/emergency';
import { decodePushIdTimestamp } from '../../shared/utils/push-id';

export type SortKey = 'createdAt' | 'name' | 'city' | 'status' | 'carModel';
export type SortDir = 'asc' | 'desc';

function normaliseStatus(value: unknown): EmergencyStatus {
  const s = String(value ?? '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if ((EMERGENCY_STATUSES as string[]).includes(s)) return s as EmergencyStatus;
  if (['active', 'open', 'pending', 'online', 'waiting'].includes(s)) return 'new';
  if (['enroute', 'on_the_way', 'onway', 'dispatched'].includes(s)) return 'en_route';
  if (['done', 'closed', 'complete', 'completed', 'finished'].includes(s)) return 'resolved';
  if (['canceled', 'rejected', 'declined'].includes(s)) return 'cancelled';
  return 'new';
}

/**
 * Domain service for rescue requests. Wraps the raw Firebase read in signals
 * and exposes filtering, sorting, computed analytics and dispatch actions.
 */
@Injectable({
  providedIn: 'root',
})
export class EmergencyService {
  private readonly data = inject(DataService);
  readonly path = 'emergency';

  private readonly _loaded = signal(false);
  private readonly _error = signal<string | null>(null);
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  /** Raw live object map from Firebase (preserves the original read contract). */
  private readonly raw = toSignal(
    this.data.getData(this.path).pipe(
      tap(() => this._loaded.set(true)),
      map((v) => (v ?? {}) as Record<string, IEmergency>),
      catchError((err) => {
        this._error.set(String(err?.message ?? err));
        this._loaded.set(true);
        return of({} as Record<string, IEmergency>);
      }),
    ),
    { initialValue: {} as Record<string, IEmergency> },
  );

  /** Normalised list of all rescue requests. */
  readonly all = computed<IEmergencyView[]>(() => {
    const obj = this.raw() ?? {};
    return Object.entries(obj)
      .filter(([, v]) => v && typeof v === 'object')
      .map(([key, v]) => this.toView(key, v as IEmergency));
  });

  // ---- filter / sort state ----
  readonly search = signal('');
  readonly statusFilter = signal<EmergencyStatus | 'all'>('all');
  readonly cityFilter = signal<string>('all');
  readonly sortKey = signal<SortKey>('createdAt');
  readonly sortDir = signal<SortDir>('desc');

  readonly cities = computed(() =>
    Array.from(new Set(this.all().map((e) => e.city).filter((c) => c && c !== '—'))).sort(),
  );

  readonly filtered = computed<IEmergencyView[]>(() => {
    const q = this.search().trim().toLowerCase();
    const sf = this.statusFilter();
    const cf = this.cityFilter();

    const list = this.all().filter((e) => {
      if (sf !== 'all' && e.status !== sf) return false;
      if (cf !== 'all' && e.city !== cf) return false;
      if (q) {
        const hay =
          `${e.name} ${e.telephone} ${e.city} ${e.area} ${e.carModel} ${e.carPlateNumber} ${e.vin} ${e.userId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const key = this.sortKey();
    return [...list].sort((a, b) => {
      if (key === 'createdAt') return (a.createdAt - b.createdAt) * dir;
      const av = String(a[key]).toLowerCase();
      const bv = String(b[key]).toLowerCase();
      return av.localeCompare(bv) * dir;
    });
  });

  readonly hasActiveFilters = computed(
    () => !!this.search() || this.statusFilter() !== 'all' || this.cityFilter() !== 'all',
  );

  // ---- analytics ----
  readonly total = computed(() => this.all().length);

  readonly byStatus = computed<Record<EmergencyStatus, number>>(() => {
    const acc: Record<EmergencyStatus, number> = {
      new: 0,
      assigned: 0,
      en_route: 0,
      resolved: 0,
      cancelled: 0,
    };
    for (const e of this.all()) acc[e.status]++;
    return acc;
  });

  readonly activeCount = computed(
    () => this.byStatus().new + this.byStatus().assigned + this.byStatus().en_route,
  );

  readonly resolvedRate = computed(() => {
    const t = this.total();
    return t ? Math.round((this.byStatus().resolved / t) * 100) : 0;
  });

  readonly byCity = computed(() => {
    const m = new Map<string, number>();
    for (const e of this.all()) {
      const c = e.city || 'Unknown';
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return Array.from(m, ([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);
  });

  /** Daily buckets for the last 14 days (uses decoded push-id timestamps). */
  readonly timeline = computed(() => {
    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: 0,
      };
    });
    const first = buckets[0].date.getTime();
    for (const e of this.all()) {
      if (!e.createdAt) continue;
      const idx = Math.floor((e.createdAt - first) / 86_400_000);
      if (idx >= 0 && idx < days) buckets[idx].count++;
    }
    return buckets;
  });

  // ---- mutations (filters) ----
  setSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'name' || key === 'city' ? 'asc' : 'desc');
    }
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('all');
    this.cityFilter.set('all');
  }

  // ---- dispatch write-back ----
  async setStatus(key: string, status: EmergencyStatus, assignedTo?: string): Promise<void> {
    const patch: Record<string, unknown> = { status, updatedAt: Date.now() };
    if (assignedTo !== undefined) patch['assignedTo'] = assignedTo;
    await this.data.update(`${this.path}/${key}`, patch);
  }

  private toView(key: string, e: IEmergency): IEmergencyView {
    const u = e.user ?? ({} as IEmergency['user']);
    return {
      key,
      status: normaliseStatus(e.status ?? u?.status),
      latitude: Number(e.latitude) || 0,
      longitude: Number(e.longitude) || 0,
      createdAt: e.createdAt ?? decodePushIdTimestamp(key) ?? 0,
      name: u?.name ?? '—',
      telephone: u?.telephone ?? '—',
      city: u?.cityName ?? '—',
      area: u?.area ?? '—',
      carModel: u?.carModel ?? '—',
      carPlateNumber: u?.carPlateNumber ?? '—',
      vin: u?.vin ?? '—',
      userId: u?.id ?? '—',
      assignedTo: e.assignedTo ?? '',
      raw: { key, ...e },
    };
  }
}
