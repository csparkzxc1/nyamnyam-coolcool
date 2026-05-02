import type { TimelineEvent } from '@/lib/timelineEvents';

import { bucketFor, summarizePersonal } from './personalSummary';

const at = (iso: string): Date => new Date(iso);

describe('summarizePersonal — feed interval', () => {
  it('returns null with fewer than 2 feeds', () => {
    const events: TimelineEvent[] = [
      { id: '1', kind: 'feed', startedAt: at('2026-05-02T08:00:00') },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.feedIntervalMinutes).toBeNull();
    expect(result.feedSampleCount).toBe(0);
  });

  it('averages gaps between consecutive feed starts', () => {
    // 08:00 → 11:00 (180m) → 14:30 (210m). Average = 195.
    const events: TimelineEvent[] = [
      { id: '1', kind: 'feed', startedAt: at('2026-05-02T08:00:00') },
      { id: '2', kind: 'feed', startedAt: at('2026-05-02T11:00:00') },
      { id: '3', kind: 'feed', startedAt: at('2026-05-02T14:30:00') },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.feedIntervalMinutes).toBe(195);
    expect(result.feedSampleCount).toBe(2);
  });

  it('sorts events before computing — order-insensitive', () => {
    const events: TimelineEvent[] = [
      { id: '3', kind: 'feed', startedAt: at('2026-05-02T14:30:00') },
      { id: '1', kind: 'feed', startedAt: at('2026-05-02T08:00:00') },
      { id: '2', kind: 'feed', startedAt: at('2026-05-02T11:00:00') },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.feedIntervalMinutes).toBe(195);
  });

  it('ignores non-feed events when computing the interval', () => {
    const events: TimelineEvent[] = [
      { id: '1', kind: 'feed', startedAt: at('2026-05-02T08:00:00') },
      {
        id: '2',
        kind: 'sleep',
        startedAt: at('2026-05-02T09:00:00'),
        endedAt: at('2026-05-02T10:00:00'),
      },
      { id: '3', kind: 'feed', startedAt: at('2026-05-02T11:00:00') },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.feedIntervalMinutes).toBe(180);
    expect(result.feedSampleCount).toBe(1);
  });
});

describe('summarizePersonal — daily sleep hours', () => {
  it('returns null when no completed sleeps exist', () => {
    const events: TimelineEvent[] = [
      // active sleep (no endedAt) — must be excluded
      { id: '1', kind: 'sleep', startedAt: at('2026-05-02T09:00:00') },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.dailySleepHours).toBeNull();
    expect(result.sleepSampleCount).toBe(0);
  });

  it('averages completed sleep across days that have data', () => {
    // Only one day of data (2026-05-02): two sleeps totalling 4h.
    const events: TimelineEvent[] = [
      {
        id: '1',
        kind: 'sleep',
        startedAt: at('2026-05-02T09:00:00'),
        endedAt: at('2026-05-02T11:00:00'),
      },
      {
        id: '2',
        kind: 'sleep',
        startedAt: at('2026-05-02T14:00:00'),
        endedAt: at('2026-05-02T16:00:00'),
      },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.dailySleepHours).toBe(4);
    expect(result.sleepSampleCount).toBe(2);
  });

  it('divides by full lookback window when data spans the whole window', () => {
    // 7 days, 4h per day = 28h total. Average should be 4h/day.
    const events: TimelineEvent[] = [];
    const startOfWindow = at('2026-04-26T09:00:00').getTime();
    for (let d = 0; d < 7; d += 1) {
      const start = new Date(startOfWindow + d * 24 * 60 * 60_000);
      const end = new Date(start.getTime() + 4 * 60 * 60_000);
      events.push({ id: `${d}`, kind: 'sleep', startedAt: start, endedAt: end });
    }
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.dailySleepHours).toBe(4);
  });

  it('rounds the result to 1 decimal place', () => {
    const events: TimelineEvent[] = [
      {
        id: '1',
        kind: 'sleep',
        startedAt: at('2026-05-02T09:00:00'),
        endedAt: at('2026-05-02T09:55:00'), // 55 min ≈ 0.9h
      },
    ];
    const result = summarizePersonal(events, 7, at('2026-05-02T20:00:00'));
    expect(result.dailySleepHours).toBeCloseTo(0.9, 1);
  });
});

describe('bucketFor', () => {
  const range = { min: 120, max: 180 };

  it('returns "within" for values inside the range', () => {
    expect(bucketFor(150, range)).toBe('within');
  });

  it('returns "low" for values below the floor', () => {
    expect(bucketFor(90, range)).toBe('low');
  });

  it('returns "high" for values above the ceiling', () => {
    expect(bucketFor(240, range)).toBe('high');
  });

  it('treats the bounds as inclusive', () => {
    expect(bucketFor(120, range)).toBe('within');
    expect(bucketFor(180, range)).toBe('within');
  });
});
