import { formatCoord, initials, statusColor, statusLabel, timeAgo } from './ui';

describe('ui utils', () => {
  it('builds initials from up to two words', () => {
    expect(initials('Ahmed Asem Elfert')).toBe('AA');
    expect(initials('Mona')).toBe('M');
    expect(initials('')).toBe('?');
  });

  it('maps status to label and colour', () => {
    expect(statusLabel('new')).toBe('New');
    expect(statusLabel('en_route')).toBe('En route');
    expect(statusColor('resolved')).toBe('var(--st-resolved)');
  });

  it('handles empty time and formats coordinates', () => {
    expect(timeAgo(0)).toBe('—');
    expect(formatCoord(30.05, 31.23)).toBe('30.0500, 31.2300');
  });
});
