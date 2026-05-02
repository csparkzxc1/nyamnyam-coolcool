import { isDismissedWithin24h, useAnomaliesStore } from './anomaliesStore';

describe('anomaliesStore', () => {
  beforeEach(() => {
    useAnomaliesStore.getState().reset();
  });

  it('starts with an empty dismissedAt map', () => {
    expect(useAnomaliesStore.getState().dismissedAt).toEqual({});
  });

  it('records the timestamp when an anomaly is dismissed', () => {
    const now = new Date('2026-05-02T18:00:00');
    useAnomaliesStore.getState().dismiss('OVERFEEDING_RISK', now);
    expect(useAnomaliesStore.getState().dismissedAt.OVERFEEDING_RISK).toBe(now.getTime());
  });

  it('reset clears all dismiss state', () => {
    useAnomaliesStore.getState().dismiss('NAP_TOO_LONG', new Date());
    useAnomaliesStore.getState().reset();
    expect(useAnomaliesStore.getState().dismissedAt).toEqual({});
  });
});

describe('isDismissedWithin24h', () => {
  const now = new Date('2026-05-02T18:00:00');

  it('returns false when no timestamp recorded', () => {
    expect(isDismissedWithin24h(undefined, now)).toBe(false);
  });

  it('returns true when dismissed less than 24h ago', () => {
    const dismissed = now.getTime() - 23 * 60 * 60_000;
    expect(isDismissedWithin24h(dismissed, now)).toBe(true);
  });

  it('returns false when dismissed more than 24h ago', () => {
    const dismissed = now.getTime() - 25 * 60 * 60_000;
    expect(isDismissedWithin24h(dismissed, now)).toBe(false);
  });
});
