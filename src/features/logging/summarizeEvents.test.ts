import { describe, expect, it } from '@jest/globals';

import { formatSleepMinutes, summarizeEvents } from './summarizeEvents';

import type { DetailedEvent } from './eventsTransform';

// ============================================================
// Fixtures
// ============================================================

const at = (h: number, m = 0) => {
  const d = new Date(2026, 3, 30, 0, 0, 0, 0);
  d.setHours(h, m, 0, 0);
  return d;
};

const NOW = at(16, 0);

const feed = (
  id: string,
  start: Date,
  opts: { end?: Date; amount?: number; type?: 'breast_left' | 'formula' } = {},
): DetailedEvent => ({
  kind: 'feed',
  id: `feed-${id}`,
  startedAt: start,
  endedAt: opts.end,
  type: opts.type ?? 'formula',
  amountMl: opts.amount,
});

const sleep = (
  id: string,
  start: Date,
  opts: { end?: Date; type?: 'nap' | 'night' } = {},
): DetailedEvent => ({
  kind: 'sleep',
  id: `sleep-${id}`,
  startedAt: start,
  endedAt: opts.end,
  type: opts.type ?? 'nap',
});

const diaper = (id: string, at: Date): DetailedEvent => ({
  kind: 'diaper',
  id: `diaper-${id}`,
  startedAt: at,
  type: 'wet',
});

const bath = (id: string, at: Date): DetailedEvent => ({
  kind: 'bath',
  id: `bath-${id}`,
  startedAt: at,
});

// ============================================================
// summarizeEvents
// ============================================================

describe('summarizeEvents', () => {
  it('returns all-zero summary for empty events', () => {
    expect(summarizeEvents([], NOW)).toEqual({
      feedCount: 0,
      feedAmountMl: 0,
      sleepMinutes: 0,
      diaperCount: 0,
      bathCount: 0,
    });
  });

  it('counts feeds and sums amountMl', () => {
    const events = [
      feed('1', at(8), { amount: 80 }),
      feed('2', at(11), { amount: 100 }),
      feed('3', at(14), { amount: 60 }),
    ];
    const r = summarizeEvents(events, NOW);
    expect(r.feedCount).toBe(3);
    expect(r.feedAmountMl).toBe(240);
  });

  it('treats missing amountMl as 0 (still counts the feed)', () => {
    const events = [
      feed('1', at(8), { amount: 80 }),
      feed('2', at(11)), // breastfeed, no amount
      feed('3', at(14)),
    ];
    const r = summarizeEvents(events, NOW);
    expect(r.feedCount).toBe(3);
    expect(r.feedAmountMl).toBe(80);
  });

  it('sums completed sleep durations', () => {
    const events = [
      sleep('1', at(9), { end: at(10) }), // 60min
      sleep('2', at(13), { end: at(14, 30) }), // 90min
    ];
    const r = summarizeEvents(events, NOW);
    expect(r.sleepMinutes).toBe(150);
  });

  it('counts in-progress sleep up to now', () => {
    const events = [
      sleep('1', at(9), { end: at(10) }), // 60min
      sleep('2', at(15), {}), // in-progress: now-15:00 = 60min
    ];
    const r = summarizeEvents(events, NOW);
    expect(r.sleepMinutes).toBe(120);
  });

  it('clamps negative sleep durations to 0 (defensive)', () => {
    // Should not happen in practice but data could be malformed.
    const events = [sleep('weird', at(15), { end: at(14) })];
    const r = summarizeEvents(events, NOW);
    expect(r.sleepMinutes).toBe(0);
  });

  it('counts diapers and baths separately', () => {
    const events = [
      diaper('d1', at(8)),
      diaper('d2', at(11)),
      diaper('d3', at(14)),
      bath('ba1', at(18)),
    ];
    const r = summarizeEvents(events, NOW);
    expect(r.diaperCount).toBe(3);
    expect(r.bathCount).toBe(1);
  });

  it('handles a realistic mixed day end-to-end', () => {
    const events = [
      feed('1', at(8), { amount: 80, end: at(8, 20) }),
      sleep('1', at(8, 30), { end: at(10) }), // 90min
      diaper('d1', at(10, 5)),
      feed('2', at(11), { amount: 100, end: at(11, 25) }),
      sleep('2', at(13), { end: at(14, 30) }), // 90min
      diaper('d2', at(14, 35)),
      feed('3', at(15), { amount: 90 }), // in progress
      bath('ba1', at(15, 30)),
    ];
    const r = summarizeEvents(events, NOW);
    expect(r).toEqual({
      feedCount: 3,
      feedAmountMl: 270,
      sleepMinutes: 180,
      diaperCount: 2,
      bathCount: 1,
    });
  });

  it('does not mutate the caller events array', () => {
    const events = [feed('1', at(8), { amount: 80 })];
    const before = JSON.stringify(events);
    summarizeEvents(events, NOW);
    expect(JSON.stringify(events)).toBe(before);
  });
});

// ============================================================
// formatSleepMinutes
// ============================================================

describe('formatSleepMinutes', () => {
  it('formats sub-hour values as "N분"', () => {
    expect(formatSleepMinutes(0)).toBe('0분');
    expect(formatSleepMinutes(45)).toBe('45분');
    expect(formatSleepMinutes(59)).toBe('59분');
  });

  it('formats whole hours without trailing 0분', () => {
    expect(formatSleepMinutes(60)).toBe('1시간');
    expect(formatSleepMinutes(120)).toBe('2시간');
  });

  it('formats hours with remainder minutes', () => {
    expect(formatSleepMinutes(75)).toBe('1시간 15분');
    expect(formatSleepMinutes(270)).toBe('4시간 30분');
  });
});
