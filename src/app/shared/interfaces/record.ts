/** Flat, normalised record used by the generic list pages.
 *  Merges top-level fields and nested `user.*` fields from any El7a2ny node. */
export interface FlatRecord {
  key: string;
  createdAt: number;

  // customer / user
  id?: string | number;
  name?: string;
  telephone?: string;
  status?: string;
  cityName?: string;
  area?: string;
  carModel?: string;
  carPlateNumber?: string;
  vin?: string;

  // emergency
  latitude?: number;
  longitude?: number;

  // maintenance booking
  date?: string;
  problem?: string;
  requestType?: string;

  // amendment (car edit) request
  budge?: string;
  describition?: string;

  /** Original raw object (used when archiving/restoring). */
  raw?: unknown;
}

export type RecordAction = 'done' | 'restore' | 'vip' | 'remove';
