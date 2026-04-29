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
