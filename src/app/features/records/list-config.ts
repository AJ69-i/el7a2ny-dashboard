import { RecordAction } from '../../shared/interfaces/record';

export type CellType = 'who' | 'vehicle' | 'location' | 'booking' | 'status' | 'text';

export interface ColumnDef {
  key: string;
  label: string;
  type?: CellType;
}

export interface ListConfig {
  /** Firebase node this page reads. */
  node: string;
  /** For `done`: node to archive into. For `restore`: the active node to restore into. */
  targetNode?: string;
  title: string;
  subtitle: string;
  columns: ColumnDef[];
  action: RecordAction;
  actionLabel: string;
  showStatus?: boolean;
  showCity?: boolean;
}

const USER_COLS: ColumnDef[] = [
  { key: 'name', label: 'Customer', type: 'who' },
  { key: 'carModel', label: 'Vehicle', type: 'vehicle' },
  { key: 'cityName', label: 'Location', type: 'location' },
  { key: 'status', label: 'Status', type: 'status' },
];

export const LIST_CONFIGS: Record<string, ListConfig> = {
  maintenance: {
    node: 'maintaince_Request',
    targetNode: 'deletedMaintainceRequestUsers',
    title: 'Maintenance bookings',
    subtitle: 'Home & workshop service requests',
    action: 'done',
    actionLabel: 'Done',
    showStatus: true,
    showCity: true,
    columns: [
      { key: 'name', label: 'Customer', type: 'who' },
      { key: 'carModel', label: 'Vehicle', type: 'vehicle' },
      { key: 'date', label: 'Booking', type: 'booking' },
      { key: 'problem', label: 'Problem', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
  },
  amendments: {
    node: 'carEditRequest',
    targetNode: 'deletedCarEditRequestUsers',
    title: 'Amendment requests',
    subtitle: 'Tuning & modification requests',
    action: 'done',
    actionLabel: 'Done',
    showStatus: true,
    showCity: true,
    columns: [
      { key: 'name', label: 'Customer', type: 'who' },
      { key: 'carModel', label: 'Vehicle', type: 'vehicle' },
      { key: 'budge', label: 'Budget', type: 'text' },
      { key: 'describition', label: 'Description', type: 'text' },
      { key: 'status', label: 'Status', type: 'status' },
    ],
  },
  customers: {
    node: 'users',
    title: 'Customers',
    subtitle: 'All registered customers',
    action: 'vip',
    actionLabel: '★ Add VIP',
    showStatus: true,
    showCity: true,
    columns: USER_COLS,
  },
  vip: {
    node: 'vip',
    title: 'VIP customers',
    subtitle: 'Priority customers',
    action: 'remove',
    actionLabel: 'Remove',
    showCity: true,
    columns: USER_COLS,
  },
  'emergency-history': {
    node: 'deletedEmergencyUsers',
    targetNode: 'emergency',
    title: 'Emergency history',
    subtitle: 'Archived / resolved SOS requests',
    action: 'restore',
    actionLabel: 'Restore',
    showCity: true,
    columns: USER_COLS,
  },
  'maintenance-history': {
    node: 'deletedMaintainceRequestUsers',
    targetNode: 'maintaince_Request',
    title: 'Maintenance history',
    subtitle: 'Archived service bookings',
    action: 'restore',
    actionLabel: 'Restore',
    showCity: true,
    columns: [
      { key: 'name', label: 'Customer', type: 'who' },
      { key: 'carModel', label: 'Vehicle', type: 'vehicle' },
      { key: 'date', label: 'Booking', type: 'booking' },
      { key: 'problem', label: 'Problem', type: 'text' },
    ],
  },
  'amendment-history': {
    node: 'deletedCarEditRequestUsers',
    targetNode: 'carEditRequest',
    title: 'Amendment history',
    subtitle: 'Archived modification requests',
    action: 'restore',
    actionLabel: 'Restore',
    showCity: true,
    columns: [
      { key: 'name', label: 'Customer', type: 'who' },
      { key: 'carModel', label: 'Vehicle', type: 'vehicle' },
      { key: 'budge', label: 'Budget', type: 'text' },
      { key: 'describition', label: 'Description', type: 'text' },
    ],
  },
  'users-history': {
    node: 'deletedUsers',
    targetNode: 'users',
    title: 'Users history',
    subtitle: 'Deleted customer records',
    action: 'restore',
    actionLabel: 'Restore',
    showCity: true,
    columns: USER_COLS,
  },
};
