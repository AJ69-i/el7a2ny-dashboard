/**
 * Firebase `push()` IDs encode their creation time (ms since epoch) in the
 * first 8 characters. Decoding it lets us build time-based analytics even
 * though the records don't store an explicit timestamp.
 *
 * Reference: the 64-char ordered alphabet used by Firebase push IDs.
 */
const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

export function decodePushIdTimestamp(id: string): number | null {
  if (!id || id.length < 8) return null;
  let ts = 0;
  for (let i = 0; i < 8; i++) {
    const idx = PUSH_CHARS.indexOf(id.charAt(i));
    if (idx === -1) return null;
    ts = ts * 64 + idx;
  }
  // Sanity bounds: between 2010 and ~2100.
  if (ts < 1262304000000 || ts > 4102444800000) return null;
  return ts;
}
