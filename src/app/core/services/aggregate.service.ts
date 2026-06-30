import { Injectable, computed, inject } from '@angular/core';
import { RecordsService } from './records.service';
import { FlatRecord } from '../../shared/interfaces/record';

export type RequestKind = 'emergency' | 'maintenance' | 'amendment';

export interface TaggedRecord extends FlatRecord {
  kind: RequestKind;
  archived: boolean;
}

export interface SearchHit {
  kind: 'customer' | RequestKind;
  archived: boolean;
  record: FlatRecord;
}

function tag(rows: FlatRecord[], kind: RequestKind, archived: boolean): TaggedRecord[] {
  return rows.map((r) => ({ ...r, kind, archived }));
}

/**
 * Cross-module data access: loads every node once and joins requests/customers
 * by `user.id`. Powers the Customer 360 profile, Analytics and Global search.
 */
@Injectable({ providedIn: 'root' })
export class AggregateService {
  private readonly records = inject(RecordsService);

  // active nodes
  readonly emergency = this.records.collection('emergency');
  readonly maintenance = this.records.collection('maintaince_Request');
  readonly amendments = this.records.collection('carEditRequest');
  readonly customers = this.records.collection('users');
  readonly vip = this.records.collection('vip');

  // archived (history) nodes
  readonly emergencyHist = this.records.collection('deletedEmergencyUsers');
  readonly maintenanceHist = this.records.collection('deletedMaintainceRequestUsers');
  readonly amendmentsHist = this.records.collection('deletedCarEditRequestUsers');

  /** Every request across modules, tagged with kind + archived flag. */
  readonly allRequests = computed<TaggedRecord[]>(() => [
    ...tag(this.emergency(), 'emergency', false),
    ...tag(this.maintenance(), 'maintenance', false),
    ...tag(this.amendments(), 'amendment', false),
    ...tag(this.emergencyHist(), 'emergency', true),
    ...tag(this.maintenanceHist(), 'maintenance', true),
    ...tag(this.amendmentsHist(), 'amendment', true),
  ]);

  /** Unique customers keyed by id (merges users + vip; flags VIP). */
  readonly customerIndex = computed(() => {
    const map = new Map<string, FlatRecord & { vip: boolean }>();
    for (const c of this.customers()) {
      const id = String(c.id ?? c.key);
      map.set(id, { ...c, vip: false });
    }
    for (const c of this.vip()) {
      const id = String(c.id ?? c.key);
      const existing = map.get(id);
      if (existing) existing.vip = true;
      else map.set(id, { ...c, vip: true });
    }
    return map;
  });

  readonly vipIds = computed(() => new Set(this.vip().map((c) => String(c.id ?? c.key))));

  isVip(id: string | number | undefined): boolean {
    return id != null && this.vipIds().has(String(id));
  }

  customerById(id: string): (FlatRecord & { vip: boolean }) | null {
    return this.customerIndex().get(String(id)) ?? null;
  }

  /** All requests belonging to a customer id, newest first. */
  requestsForUser(id: string): TaggedRecord[] {
    return this.allRequests()
      .filter((r) => String(r.id) === String(id))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Free-text search across customers and requests (name/phone/plate/VIN/id). */
  search(query: string, limit = 8): SearchHit[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const match = (r: FlatRecord) =>
      `${r.name ?? ''} ${r.telephone ?? ''} ${r.carPlateNumber ?? ''} ${r.vin ?? ''} ${r.carModel ?? ''} ${r.id ?? ''} ${r.cityName ?? ''}`
        .toLowerCase()
        .includes(q);

    const hits: SearchHit[] = [];
    for (const c of this.customerIndex().values()) {
      if (match(c)) hits.push({ kind: 'customer', archived: false, record: c });
      if (hits.length >= limit) break;
    }
    for (const r of this.allRequests()) {
      if (hits.length >= limit * 2) break;
      if (match(r)) hits.push({ kind: r.kind, archived: r.archived, record: r });
    }
    return hits.slice(0, limit * 2);
  }
}
