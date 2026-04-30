import type { TimelineEvent } from '@/lib/timelineEvents';

import type { BathRecord, DiaperRecord, FeedingRecord, SleepRecord } from './api';

/**
 * Raw records as fetched from Supabase, grouped by table.
 * Used as the input to `rowsToTimelineEvents`.
 */
export interface RawEvents {
  feeds: readonly FeedingRecord[];
  sleeps: readonly SleepRecord[];
  diapers: readonly DiaperRecord[];
  baths: readonly BathRecord[];
}

/**
 * Merges 4 record types from Supabase into a unified TimelineEvent[],
 * sorted ascending by start time.
 *
 * Notes:
 * - DB columns differ across tables (`start_at`/`end_at` for feeding/sleep,
 *   `at` for diaper/bath). This function normalizes them onto the
 *   `startedAt` / `endedAt?` shape that home-screen components expect.
 * - id prefix (`feed-`, `sleep-`, ...) prevents accidental collisions if a
 *   UUID ever repeated across tables (extremely unlikely but cheap insurance).
 *   It also makes the prefix a free indicator of source table when debugging.
 */
export function rowsToTimelineEvents(raw: RawEvents): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const f of raw.feeds) {
    events.push({
      id: `feed-${f.id}`,
      kind: 'feed',
      startedAt: new Date(f.start_at),
      endedAt: f.end_at ? new Date(f.end_at) : undefined,
    });
  }

  for (const s of raw.sleeps) {
    events.push({
      id: `sleep-${s.id}`,
      kind: 'sleep',
      startedAt: new Date(s.start_at),
      endedAt: s.end_at ? new Date(s.end_at) : undefined,
    });
  }

  for (const d of raw.diapers) {
    events.push({
      id: `diaper-${d.id}`,
      kind: 'diaper',
      startedAt: new Date(d.at),
    });
  }

  for (const b of raw.baths) {
    events.push({
      id: `bath-${b.id}`,
      kind: 'bath',
      startedAt: new Date(b.at),
    });
  }

  events.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  return events;
}

// ============================================================
// DetailedEvent — record-tab variant carrying type/note/etc.
// ============================================================

/**
 * The 4 feeding_records.type values surfaced in the UI.
 * Mirrors the DB CHECK constraint exactly.
 */
export type FeedingType = 'breast_left' | 'breast_right' | 'formula' | 'solid';

/**
 * sleep_records.type — naps and overnight sleeps.
 */
export type SleepType = 'nap' | 'night';

/**
 * diaper_records.type — wet, dirty, or both.
 */
export type DiaperType = 'wet' | 'dirty' | 'both';

/**
 * A timeline event with full per-kind detail.
 *
 * Used by the record tab (T701) where every row needs to display
 * type, duration, optional notes, etc. The home-screen gradient
 * timeline keeps using the leaner `TimelineEvent` — the two
 * abstractions are intentionally separate because they answer
 * different questions ("when did things happen" vs "what exactly
 * happened").
 *
 * Discriminated by `kind` so TypeScript narrows fields automatically.
 */
export type DetailedEvent =
  | {
      kind: 'feed';
      id: string;
      startedAt: Date;
      endedAt?: Date;
      type: FeedingType;
      amountMl?: number;
      note?: string;
    }
  | {
      kind: 'sleep';
      id: string;
      startedAt: Date;
      endedAt?: Date;
      type: SleepType;
      quality?: number;
    }
  | {
      kind: 'diaper';
      id: string;
      startedAt: Date;
      type: DiaperType;
      color?: string;
    }
  | {
      kind: 'bath';
      id: string;
      startedAt: Date;
      note?: string;
    };

/**
 * Merges 4 record types into a unified DetailedEvent[], sorted ascending
 * by start time.
 *
 * Same shape contract as `rowsToTimelineEvents` (sorted, prefixed ids)
 * but preserves per-kind detail fields. Designed for the record tab,
 * timeline editor, and any future analytics screen that needs the
 * full payload.
 *
 * id prefixing (`feed-`, `sleep-`, etc.) is identical to the
 * lightweight transform — keeps debugging consistent across both views.
 */
export function rowsToDetailedEvents(raw: RawEvents): DetailedEvent[] {
  const events: DetailedEvent[] = [];

  for (const f of raw.feeds) {
    events.push({
      kind: 'feed',
      id: `feed-${f.id}`,
      startedAt: new Date(f.start_at),
      endedAt: f.end_at ? new Date(f.end_at) : undefined,
      type: f.type as FeedingType,
      amountMl: f.amount_ml ?? undefined,
      note: f.note ?? undefined,
    });
  }

  for (const s of raw.sleeps) {
    events.push({
      kind: 'sleep',
      id: `sleep-${s.id}`,
      startedAt: new Date(s.start_at),
      endedAt: s.end_at ? new Date(s.end_at) : undefined,
      type: s.type as SleepType,
      quality: s.quality ?? undefined,
    });
  }

  for (const d of raw.diapers) {
    events.push({
      kind: 'diaper',
      id: `diaper-${d.id}`,
      startedAt: new Date(d.at),
      type: d.type as DiaperType,
      color: d.color ?? undefined,
    });
  }

  for (const b of raw.baths) {
    events.push({
      kind: 'bath',
      id: `bath-${b.id}`,
      startedAt: new Date(b.at),
      note: b.note ?? undefined,
    });
  }

  events.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  return events;
}
