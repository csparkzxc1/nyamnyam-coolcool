/**
 * Aggregates a baby's recent activity into the metrics shown on the
 * "우리 아이 vs 평균" comparison card in the Guide tab.
 *
 * Two metrics for the MVP:
 *   - feedIntervalMinutes: average gap between consecutive feed starts
 *   - dailySleepHours:     average completed sleep hours per day
 *
 * Each metric is paired with a `samples` count so the UI can fall back to
 * "데이터가 부족해요" copy when the baseline is too thin to be useful.
 */
import { differenceInMinutes } from 'date-fns';

import type { TimelineEvent } from '@/lib/timelineEvents';

import type { NumericRange } from './standards';

export interface PersonalSummary {
  /** Average minutes between consecutive feeds; null when < 2 feeds. */
  feedIntervalMinutes: number | null;
  /** Number of consecutive-feed gaps used to compute the interval. */
  feedSampleCount: number;
  /** Average completed sleep hours per day across the lookback window. */
  dailySleepHours: number | null;
  /** Number of completed sleep records used. */
  sleepSampleCount: number;
}

/**
 * Compares a personal value against a standard range and returns one of
 * three buckets the UI uses to colour the comparison badge.
 *
 * - `within`: personal sits inside the standard range
 * - `low`:    personal is below the range floor
 * - `high`:   personal is above the range ceiling
 */
export type ComparisonBucket = 'within' | 'low' | 'high';

export function bucketFor(value: number, range: NumericRange): ComparisonBucket {
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'within';
}

/**
 * Build the personal summary from the last `lookbackDays` of timeline
 * events. The caller is responsible for fetching that window
 * (typically via `useEvents(babyId, 7)`).
 *
 * Feed interval is computed from consecutive `feed` event START times
 * after sorting — robust to records arriving in any order.
 *
 * Daily sleep hours sums the duration of every COMPLETED sleep
 * (those with both startedAt and endedAt) and divides by the number of
 * distinct local days the lookback window covers.
 */
export function summarizePersonal(
  events: readonly TimelineEvent[],
  lookbackDays: number,
  now: Date = new Date(),
): PersonalSummary {
  const feeds = events
    .filter((e) => e.kind === 'feed')
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

  let feedIntervalMinutes: number | null = null;
  const feedSampleCount = Math.max(0, feeds.length - 1);
  if (feeds.length >= 2) {
    let total = 0;
    for (let i = 1; i < feeds.length; i += 1) {
      total += differenceInMinutes(feeds[i].startedAt, feeds[i - 1].startedAt);
    }
    feedIntervalMinutes = Math.round(total / feedSampleCount);
  }

  const completedSleeps = events.filter(
    (e) => e.kind === 'sleep' && e.endedAt !== undefined,
  );
  let dailySleepHours: number | null = null;
  if (completedSleeps.length > 0 && lookbackDays > 0) {
    const totalMinutes = completedSleeps.reduce((sum, s) => {
      if (!s.endedAt) return sum;
      return sum + differenceInMinutes(s.endedAt, s.startedAt);
    }, 0);
    // Cap the lookback denominator at how far back we actually have data —
    // a baby with 2 days of records shouldn't average their sleep across 7.
    const earliestStart = Math.min(...completedSleeps.map((s) => s.startedAt.getTime()));
    const daysOfData = Math.max(
      1,
      Math.min(lookbackDays, Math.ceil((now.getTime() - earliestStart) / (24 * 60 * 60_000))),
    );
    dailySleepHours = Math.round((totalMinutes / 60 / daysOfData) * 10) / 10;
  }

  return {
    feedIntervalMinutes,
    feedSampleCount,
    dailySleepHours,
    sleepSampleCount: completedSleeps.length,
  };
}
