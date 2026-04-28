export type TimelineEventKind = 'feed' | 'sleep' | 'diaper' | 'bath';

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  startedAt: Date;
  /** Only meaningful for range-style events (sleep, feed). */
  endedAt?: Date;
}

/**
 * Returns the fraction (0.0 ~ 1.0) of the way through the day for a given
 * date. Used to position events along the 24-hour timeline.
 *
 * 00:00 → 0.0
 * 12:00 → 0.5
 * 23:59 → ~1.0
 *
 * Anchors to the local-day start of `referenceDay` so events outside today
 * clamp to 0 or 1.
 */
export function dayFraction(at: Date, referenceDay: Date): number {
  const start = new Date(
    referenceDay.getFullYear(),
    referenceDay.getMonth(),
    referenceDay.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
  const end = start + 24 * 60 * 60 * 1000;

  const t = at.getTime();
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}

/**
 * Filters events down to those whose primary timestamp falls on the given
 * reference day (local time). Range events are kept if their `startedAt`
 * falls on this day, regardless of where they end.
 */
export function filterEventsForDay(
  events: readonly TimelineEvent[],
  referenceDay: Date,
): TimelineEvent[] {
  const dayStart = new Date(
    referenceDay.getFullYear(),
    referenceDay.getMonth(),
    referenceDay.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  return events.filter((e) => {
    const t = e.startedAt.getTime();
    return t >= dayStart && t < dayEnd;
  });
}

/**
 * The visual marker hours rendered beneath the timeline. 3-hour intervals
 * give a familiar "morning / noon / afternoon / evening / night" cadence
 * without visual clutter.
 */
export const MARKER_HOURS: readonly number[] = [6, 9, 12, 15, 18, 21];
