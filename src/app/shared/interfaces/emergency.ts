import { IUser } from './user';

/** Dispatch lifecycle of a rescue request. */
export type EmergencyStatus = 'new' | 'assigned' | 'en_route' | 'resolved' | 'cancelled';

export const EMERGENCY_STATUSES: EmergencyStatus[] = [
  'new',
  'assigned',
  'en_route',
  'resolved',
  'cancelled',
];

export const STATUS_LABEL: Record<EmergencyStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  en_route: 'En route',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

/**
 * Original Firebase record shape (unchanged contract).
 * `status`, `createdAt`, `assignedTo`, `updatedAt`, `note` are optional fields
 * the dashboard may add non-destructively for dispatch tracking.
 */
export interface IEmergency {
  latitude: number;
  longitude: number;
  user: IUser;
  status?: EmergencyStatus | string;
  createdAt?: number;
  updatedAt?: number;
  assignedTo?: string;
  note?: string;
}

export interface IEmergencyWithKey extends IEmergency {
  key: string;
}

/** Flat, normalised view-model consumed by the UI components. */
export interface IEmergencyView {
  key: string;
  status: EmergencyStatus;
  latitude: number;
  longitude: number;
  createdAt: number;
  name: string;
  telephone: string;
  city: string;
  area: string;
  carModel: string;
  carPlateNumber: string;
  vin: string;
  userId: string | number;
  assignedTo: string;
  raw: IEmergencyWithKey;
}
