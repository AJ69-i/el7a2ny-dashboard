import {
  EnvironmentInjector,
  Injectable,
  Signal,
  WritableSignal,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';

import { DataService } from '../../shared/services/data.service';
import { FlatRecord } from '../../shared/interfaces/record';
import { decodePushIdTimestamp } from '../../shared/utils/push-id';

interface NodeState {
  data: Signal<FlatRecord[]>;
  loading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
}

/**
 * Generic Firebase collection access for every El7a2ny list node.
 * Each node is exposed as a signal of normalised flat records, plus loading
 * and error signals so the UI can render proper loading / error / empty states.
 */
@Injectable({ providedIn: 'root' })
export class RecordsService {
  private readonly data = inject(DataService);
  private readonly injector = inject(EnvironmentInjector);
  private readonly cache = new Map<string, NodeState>();

  private nodeState(node: string): NodeState {
    let state = this.cache.get(node);
    if (!state) {
      const loading = signal(true);
      const error = signal<string | null>(null);
      const data = runInInjectionContext(this.injector, () =>
        toSignal(
          this.data.getData(node).pipe(
            tap(() => loading.set(false)),
            map((v) => this.normalize((v ?? {}) as Record<string, any>)),
            catchError((err) => {
              error.set(String(err?.message ?? err));
              loading.set(false);
              return of([] as FlatRecord[]);
            }),
          ),
          { initialValue: [] as FlatRecord[] },
        ),
      );
      state = { data, loading, error };
      this.cache.set(node, state);
    }
    return state;
  }

  /** Live signal of the (normalised) records at `node`, cached per node. */
  collection(node: string): Signal<FlatRecord[]> {
    return this.nodeState(node).data;
  }

  /** True until the node's first emission (or error). */
  loading(node: string): Signal<boolean> {
    return this.nodeState(node).loading.asReadonly();
  }

  /** Error message if the node read failed, else null. */
  error(node: string): Signal<string | null> {
    return this.nodeState(node).error.asReadonly();
  }

  private normalize(obj: Record<string, any>): FlatRecord[] {
    return Object.entries(obj)
      .filter(([, v]) => v && typeof v === 'object')
      .map(([key, v]) => {
        const u = v.user ?? {};
        const lat = Number(v.latitude ?? v.lat);
        const lng = Number(v.longitude ?? v.long);
        return {
          key,
          createdAt: v.createdAt ?? decodePushIdTimestamp(key) ?? 0,
          latitude: Number.isFinite(lat) ? lat : 0,
          longitude: Number.isFinite(lng) ? lng : 0,
          date: v.date,
          problem: v.problem,
          requestType: v.requestType,
          budge: v.budge,
          describition: v.describition,
          id: v.id ?? u.id,
          name: v.name ?? u.name,
          telephone: v.telephone ?? u.telephone,
          status: v.status ?? u.status,
          cityName: v.cityName ?? u.cityName,
          area: v.area ?? u.area,
          carModel: v.carModel ?? u.carModel,
          carPlateNumber: v.carPlateNumber ?? u.carPlateNumber,
          vin: v.vin ?? u.vin,
          raw: v,
        } as FlatRecord;
      });
  }

  /** "Done" — archive into a `deleted*` node, then remove from the active node. */
  async softDelete(node: string, deletedNode: string, rec: FlatRecord): Promise<void> {
    await this.data.set(`${deletedNode}/${rec.key}`, this.sanitize(rec.raw));
    await this.data.remove(`${node}/${rec.key}`);
  }

  /** Restore an archived record back into its active node. */
  async restore(archiveNode: string, activeNode: string, rec: FlatRecord): Promise<void> {
    await this.data.set(`${activeNode}/${rec.key}`, this.sanitize(rec.raw));
    await this.data.remove(`${archiveNode}/${rec.key}`);
  }

  /** Promote a customer to VIP (vip node stores flat user fields). */
  addVip(rec: FlatRecord): void {
    const raw = rec.raw as { user?: unknown } | undefined;
    this.data.push('vip', this.sanitize(raw?.user ?? rec.raw));
  }

  /** Remove a record from a node by key. */
  async removeFrom(node: string, rec: FlatRecord): Promise<void> {
    await this.data.remove(`${node}/${rec.key}`);
  }

  /** Defensive: never re-persist plaintext passwords when copying records. */
  private sanitize(value: unknown): unknown {
    if (value == null || typeof value !== 'object') return value;
    const clone = JSON.parse(JSON.stringify(value));
    const scrub = (o: any): void => {
      if (o && typeof o === 'object') {
        delete o.password;
        for (const k of Object.keys(o)) scrub(o[k]);
      }
    };
    scrub(clone);
    return clone;
  }
}
