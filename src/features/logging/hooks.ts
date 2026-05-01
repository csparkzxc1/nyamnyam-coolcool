import { useQuery } from '@tanstack/react-query';

import type { TimelineEvent } from '@/lib/timelineEvents';

import {
  listBathsBetween,
  listDiapersBetween,
  listFeedingsBetween,
  listRecentBaths,
  listRecentDiapers,
  listRecentFeedings,
  listRecentSleeps,
  listSleepsBetween,
} from './api';
import { rowsToDetailedEvents, rowsToTimelineEvents, type DetailedEvent } from './eventsTransform';

/**
 * Fetches all event records for a baby across the 4 record tables and
 * merges them into a unified TimelineEvent[].
 *
 * The 4 fetches run in parallel via Promise.all — single round-trip
 * latency rather than 4 sequential.
 *
 * @param babyId  Pass null when no baby is selected. The query stays
 *                disabled (`enabled: !!babyId`), so no network call fires.
 * @param days    Look-back window in days. Default 7. Tune up for the
 *                history tab, down for the home screen.
 *
 * Cache key includes `babyId` and `days`, so swapping baby or window
 * triggers an automatic refetch.
 */
export function useEvents(babyId: string | null, days = 7) {
  return useQuery<TimelineEvent[]>({
    queryKey: ['events', babyId, days],
    queryFn: async () => {
      // The `enabled` guard means babyId is non-null when this runs, but
      // narrow it for TS without an exclamation mark.
      if (!babyId) return [];
      const [feeds, sleeps, diapers, baths] = await Promise.all([
        listRecentFeedings(babyId, days),
        listRecentSleeps(babyId, days),
        listRecentDiapers(babyId, days),
        listRecentBaths(babyId, days),
      ]);
      return rowsToTimelineEvents({ feeds, sleeps, diapers, baths });
    },
    enabled: !!babyId,
  });
}

// ============================================================
// list by single calendar day (T701 record timeline)
// ============================================================

/**
 * Returns the [start, end) Date pair covering one local calendar day.
 * Half-open by convention so back-to-back days never double-count
 * an event sitting exactly on midnight.
 */
function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Build a stable cache key for a date — local YYYY-MM-DD (NOT toISOString,
 * which is UTC and would silently shift the key around midnight in
 * non-UTC timezones, busting the cache for "the same day").
 */
function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Fetches all events for a baby that fall within the given local calendar
 * day, then merges them into a unified TimelineEvent[] sorted by time.
 *
 * For range-typed records (feeding, sleep), an event is included if its
 * START is within the day. A sleep that crosses midnight stays attached
 * to the day it began on — matches how parents naturally talk about it.
 *
 * The 4 fetches run in parallel via Promise.all.
 *
 * @param babyId  Pass null when no baby is selected; query stays disabled.
 * @param date    Any Date that falls on the target local day. Hours,
 *                minutes, seconds are ignored.
 *
 * Cache key includes the local YYYY-MM-DD, so swapping days triggers an
 * automatic refetch and yesterday's data stays cached when the user
 * navigates back to today.
 */
export function useEventsByDate(babyId: string | null, date: Date) {
  const key = dateKey(date);

  return useQuery<DetailedEvent[]>({
    queryKey: ['eventsByDate', babyId, key],
    queryFn: async () => {
      if (!babyId) return [];
      const { start, end } = getDayBounds(date);
      const [feeds, sleeps, diapers, baths] = await Promise.all([
        listFeedingsBetween(babyId, start, end),
        listSleepsBetween(babyId, start, end),
        listDiapersBetween(babyId, start, end),
        listBathsBetween(babyId, start, end),
      ]);
      return rowsToDetailedEvents({ feeds, sleeps, diapers, baths });
    },
    enabled: !!babyId,
  });
}
