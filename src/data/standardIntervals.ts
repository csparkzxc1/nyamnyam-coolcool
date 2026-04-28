/**
 * Standard feeding intervals for newborns and infants, used as the population
 * baseline that gets blended with the baby's personal pattern in the
 * prediction engine.
 *
 * Sources of truth (intentionally hard-coded so the medical baseline lives
 * in one reviewable file rather than scattered through prediction logic):
 * - Korean Pediatric Society guidance for healthy term infants
 * - WHO Infant and Young Child Feeding standards (general intervals)
 *
 * These are TYPICAL intervals, not prescriptions. The prediction engine
 * blends them with personal data and the home screen always exposes a
 * confidence level so caregivers know how much to trust the result.
 */

export interface StandardInterval {
  /** Inclusive lower bound of the age window, in days since birth. */
  fromDay: number;
  /** Exclusive upper bound. */
  toDay: number;
  /** Typical interval between feeds, in minutes. */
  intervalMinutes: number;
  /** Human-readable label of the age window for debugging / docs. */
  label: string;
}

export const STANDARD_FEED_INTERVALS: readonly StandardInterval[] = [
  { fromDay: 0, toDay: 14, intervalMinutes: 150, label: '0~2주' },
  { fromDay: 14, toDay: 30, intervalMinutes: 165, label: '2~4주' },
  { fromDay: 30, toDay: 60, intervalMinutes: 180, label: '1~2개월' },
  { fromDay: 60, toDay: 120, intervalMinutes: 210, label: '2~4개월' },
  { fromDay: 120, toDay: 180, intervalMinutes: 240, label: '4~6개월' },
  { fromDay: 180, toDay: 365, intervalMinutes: 270, label: '6~12개월' },
];

/** Returns the typical feed interval (minutes) for a baby of the given age in days. */
export function standardFeedIntervalForAgeDays(ageInDays: number): number {
  if (ageInDays < 0) return STANDARD_FEED_INTERVALS[0].intervalMinutes;

  for (const window of STANDARD_FEED_INTERVALS) {
    if (ageInDays >= window.fromDay && ageInDays < window.toDay) {
      return window.intervalMinutes;
    }
  }

  // Beyond 12 months — fall back to the oldest band. The app is targeted at
  // 0~12 months, so this is a safe outer bound.
  return STANDARD_FEED_INTERVALS[STANDARD_FEED_INTERVALS.length - 1].intervalMinutes;
}
