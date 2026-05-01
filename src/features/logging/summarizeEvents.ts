import { differenceInMinutes } from 'date-fns';

import type { DetailedEvent } from './eventsTransform';

export interface DailySummary {
  /** Number of feeding records (any type). */
  feedCount: number;
  /** Sum of amount_ml across feedings. Undefined amounts contribute 0. */
  feedAmountMl: number;
  /** Total minutes asleep across all sleep events. In-progress sleeps
   *  count up to `now`. */
  sleepMinutes: number;
  /** Number of diaper records. */
  diaperCount: number;
  /** Number of bath records. */
  bathCount: number;
}

const ZERO: DailySummary = {
  feedCount: 0,
  feedAmountMl: 0,
  sleepMinutes: 0,
  diaperCount: 0,
  bathCount: 0,
};

/**
 * Reduce a day's events into the totals that the home screen and the
 * record-tab header display.
 *
 * - Feed amount sums `amountMl`; missing/null amounts contribute 0.
 * - Sleep minutes count up to `now` for in-progress sleeps (no endedAt),
 *   matching the user-intuitive reading "how long has the baby slept
 *   today, including right now".
 * - Counts are simple lengths — no de-duplication or filtering.
 *
 * Pure: same input → same output. No mutation of the events array.
 */
export function summarizeEvents(events: readonly DetailedEvent[], now: Date): DailySummary {
  const result: DailySummary = { ...ZERO };

  for (const e of events) {
    if (e.kind === 'feed') {
      result.feedCount += 1;
      if (e.amountMl !== undefined) {
        result.feedAmountMl += e.amountMl;
      }
    } else if (e.kind === 'sleep') {
      const end = e.endedAt ?? now;
      const minutes = Math.max(0, differenceInMinutes(end, e.startedAt));
      result.sleepMinutes += minutes;
    } else if (e.kind === 'diaper') {
      result.diaperCount += 1;
    } else if (e.kind === 'bath') {
      result.bathCount += 1;
    }
  }

  return result;
}

/**
 * Format minutes into a Korean duration: "4시간 30분", "45분", or
 * "0분" for empty days. Mirrors the home-screen tone.
 */
export function formatSleepMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
