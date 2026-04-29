import { useQuery } from '@tanstack/react-query';

import type { TimelineEvent } from '@/lib/timelineEvents';

import { listRecentBaths, listRecentDiapers, listRecentFeedings, listRecentSleeps } from './api';
import { rowsToTimelineEvents } from './eventsTransform';

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
