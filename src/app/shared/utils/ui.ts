import { EmergencyStatus, STATUS_LABEL } from '../interfaces/emergency';

/** CSS custom-property colour for each request status. */
export function statusColor(status: EmergencyStatus): string {
  return `var(--st-${status})`;
}

export function statusLabel(status: EmergencyStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** Compact, human-friendly relative time (e.g. "3h ago"). */
export function timeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 0) return 'just now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatDateTime(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCoord(lat: number, lng: number): string {
  if (!lat && !lng) return '—';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** Initials for an avatar bubble. */
export function initials(name: string): string {
  if (!name || name === '—') return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
