import { Injectable, inject } from '@angular/core';
import { Database, ref, objectVal, update, set, remove, push } from '@angular/fire/database';
import { Observable } from 'rxjs';

/**
 * Thin wrapper over the Firebase Realtime Database.
 * The original read contract (`getData` via `objectVal`) is preserved exactly;
 * write helpers are added for dispatch actions.
 */
@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly db = inject(Database);

  /** Live stream of the object stored at `path` (unchanged behaviour). */
  public getData(path: string): Observable<unknown> {
    const dbRef = ref(this.db, path);
    return objectVal(dbRef);
  }

  /** Patch fields at `path` (non-destructive merge). */
  public update(path: string, value: Record<string, unknown>): Promise<void> {
    return update(ref(this.db, path), value);
  }

  /** Overwrite the value at `path`. */
  public set(path: string, value: unknown): Promise<void> {
    return set(ref(this.db, path), value);
  }

  /** Remove the value at `path`. */
  public remove(path: string): Promise<void> {
    return remove(ref(this.db, path));
  }

  /** Push a new child with an auto-generated key under `path`; returns the key. */
  public push(path: string, value: unknown): string {
    return push(ref(this.db, path), value).key ?? '';
  }
}
