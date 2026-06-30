import { decodePushIdTimestamp } from './push-id';

describe('decodePushIdTimestamp', () => {
  it('decodes a Firebase push id to a realistic timestamp', () => {
    const ts = decodePushIdTimestamp('-NaBr2cAMDOOaRiBT9Rs');
    expect(ts).not.toBeNull();
    expect(new Date(ts!).getFullYear()).toBeGreaterThanOrEqual(2020);
  });

  it('returns null for invalid or short ids', () => {
    expect(decodePushIdTimestamp('xy')).toBeNull();
    expect(decodePushIdTimestamp('')).toBeNull();
  });
});
