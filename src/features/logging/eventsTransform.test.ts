import { describe, expect, it } from '@jest/globals';

import { rowsToTimelineEvents, type RawEvents } from './eventsTransform';

import type { BathRecord, DiaperRecord, FeedingRecord, SleepRecord } from './api';

// ============================================================
// Test factories — minimum-fill rows matching DB shape
// ============================================================

const baseFeed = (overrides: Partial<FeedingRecord> = {}): FeedingRecord => ({
  id: 'f1',
  baby_id: 'b1',
  type: 'breast_left',
  start_at: '2026-04-29T10:00:00Z',
  end_at: null,
  amount_ml: null,
  note: null,
  created_by: 'u1',
  created_at: '2026-04-29T10:00:00Z',
  ...overrides,
});

const baseSleep = (overrides: Partial<SleepRecord> = {}): SleepRecord => ({
  id: 's1',
  baby_id: 'b1',
  type: 'nap',
  start_at: '2026-04-29T13:00:00Z',
  end_at: null,
  quality: null,
  created_by: 'u1',
  created_at: '2026-04-29T13:00:00Z',
  ...overrides,
});

const baseDiaper = (overrides: Partial<DiaperRecord> = {}): DiaperRecord => ({
  id: 'd1',
  baby_id: 'b1',
  type: 'wet',
  color: null,
  at: '2026-04-29T11:00:00Z',
  created_by: 'u1',
  created_at: '2026-04-29T11:00:00Z',
  ...overrides,
});

const baseBath = (overrides: Partial<BathRecord> = {}): BathRecord => ({
  id: 'ba1',
  baby_id: 'b1',
  at: '2026-04-29T16:00:00Z',
  note: null,
  created_by: 'u1',
  created_at: '2026-04-29T16:00:00Z',
  ...overrides,
});

const empty: RawEvents = { feeds: [], sleeps: [], diapers: [], baths: [] };

// ============================================================
// Tests
// ============================================================

describe('rowsToTimelineEvents', () => {
  it('returns empty array for no events', () => {
    expect(rowsToTimelineEvents(empty)).toEqual([]);
  });

  it('maps feeding_records.start_at and end_at correctly', () => {
    const raw: RawEvents = {
      ...empty,
      feeds: [baseFeed({ start_at: '2026-04-29T10:00:00Z', end_at: '2026-04-29T10:15:00Z' })],
    };
    const result = rowsToTimelineEvents(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'feed-f1',
      kind: 'feed',
      startedAt: new Date('2026-04-29T10:00:00Z'),
      endedAt: new Date('2026-04-29T10:15:00Z'),
    });
  });

  it('maps sleep_records.start_at and end_at correctly', () => {
    const raw: RawEvents = {
      ...empty,
      sleeps: [baseSleep({ start_at: '2026-04-29T13:00:00Z', end_at: '2026-04-29T15:00:00Z' })],
    };
    const result = rowsToTimelineEvents(raw);
    expect(result[0]).toEqual({
      id: 'sleep-s1',
      kind: 'sleep',
      startedAt: new Date('2026-04-29T13:00:00Z'),
      endedAt: new Date('2026-04-29T15:00:00Z'),
    });
  });

  it('maps diaper_records.at to startedAt with no endedAt', () => {
    const raw: RawEvents = { ...empty, diapers: [baseDiaper()] };
    const result = rowsToTimelineEvents(raw);
    expect(result[0]).toEqual({
      id: 'diaper-d1',
      kind: 'diaper',
      startedAt: new Date('2026-04-29T11:00:00Z'),
    });
    expect(result[0].endedAt).toBeUndefined();
  });

  it('maps bath_records.at to startedAt with no endedAt', () => {
    const raw: RawEvents = { ...empty, baths: [baseBath()] };
    const result = rowsToTimelineEvents(raw);
    expect(result[0]).toEqual({
      id: 'bath-ba1',
      kind: 'bath',
      startedAt: new Date('2026-04-29T16:00:00Z'),
    });
  });

  it('treats null end_at as undefined for feeding/sleep', () => {
    const raw: RawEvents = {
      ...empty,
      feeds: [baseFeed({ end_at: null })],
      sleeps: [baseSleep({ end_at: null })],
    };
    const result = rowsToTimelineEvents(raw);
    expect(result[0].endedAt).toBeUndefined();
    expect(result[1].endedAt).toBeUndefined();
  });

  it('sorts events ascending by startedAt across all kinds', () => {
    const raw: RawEvents = {
      feeds: [baseFeed({ id: 'f1', start_at: '2026-04-29T15:00:00Z' })],
      sleeps: [baseSleep({ id: 's1', start_at: '2026-04-29T13:00:00Z' })],
      diapers: [baseDiaper({ id: 'd1', at: '2026-04-29T14:00:00Z' })],
      baths: [baseBath({ id: 'ba1', at: '2026-04-29T16:00:00Z' })],
    };
    const result = rowsToTimelineEvents(raw);
    expect(result.map((e) => e.kind)).toEqual(['sleep', 'diaper', 'feed', 'bath']);
  });

  it('prefixes ids by kind to avoid cross-table collisions', () => {
    const raw: RawEvents = {
      ...empty,
      feeds: [baseFeed({ id: 'shared-id', start_at: '2026-04-29T10:00:00Z' })],
      diapers: [baseDiaper({ id: 'shared-id', at: '2026-04-29T11:00:00Z' })],
    };
    const ids = rowsToTimelineEvents(raw).map((e) => e.id);
    expect(ids).toEqual(['feed-shared-id', 'diaper-shared-id']);
  });

  it('handles multiple records of the same kind correctly', () => {
    const raw: RawEvents = {
      ...empty,
      feeds: [
        baseFeed({ id: 'f1', start_at: '2026-04-29T08:00:00Z' }),
        baseFeed({ id: 'f2', start_at: '2026-04-29T11:00:00Z' }),
        baseFeed({ id: 'f3', start_at: '2026-04-29T14:00:00Z' }),
      ],
    };
    const result = rowsToTimelineEvents(raw);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id)).toEqual(['feed-f1', 'feed-f2', 'feed-f3']);
  });
});
