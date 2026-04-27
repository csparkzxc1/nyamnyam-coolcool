import { GENERIC_TIP_MESSAGES, pickDailyTip } from './tipMessages';

describe('GENERIC_TIP_MESSAGES', () => {
  it('contains at least 10 messages', () => {
    expect(GENERIC_TIP_MESSAGES.length).toBeGreaterThanOrEqual(10);
  });

  it('every message has a non-empty label and message', () => {
    for (const tip of GENERIC_TIP_MESSAGES) {
      expect(tip.label.length).toBeGreaterThan(0);
      expect(tip.message.length).toBeGreaterThan(0);
    }
  });

  it('every message is short enough to fit (under 120 chars body)', () => {
    for (const tip of GENERIC_TIP_MESSAGES) {
      expect(tip.message.length).toBeLessThan(120);
    }
  });
});

describe('pickDailyTip', () => {
  it('returns a tip from the pool', () => {
    const tip = pickDailyTip(new Date('2026-04-28T00:00:00'));
    expect(GENERIC_TIP_MESSAGES).toContainEqual(tip);
  });

  it('returns the same tip for the same calendar day', () => {
    const morning = pickDailyTip(new Date('2026-04-28T07:00:00'));
    const evening = pickDailyTip(new Date('2026-04-28T22:00:00'));
    expect(morning).toEqual(evening);
  });

  it('returns a different tip for a different calendar day (likely)', () => {
    // With 15 messages, two consecutive days will pick different ones unless
    // we happen to land on the modulo wrap. We test a 2-day window where
    // dayOfYear differs by 1, which always produces a different index.
    const day1 = pickDailyTip(new Date('2026-04-28T00:00:00'));
    const day2 = pickDailyTip(new Date('2026-04-29T00:00:00'));
    expect(day1).not.toEqual(day2);
  });
});
