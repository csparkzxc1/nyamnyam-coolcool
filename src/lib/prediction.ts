import { addMinutes, differenceInDays, differenceInMinutes } from 'date-fns';

import { standardFeedIntervalForAgeDays } from '@/data/standardIntervals';

import type { TimelineEvent } from './timelineEvents';

export type PredictionScenario = 'normal' | 'warning' | 'alert' | 'sleeping';

export type PredictionConfidence = 'learning' | 'low' | 'medium' | 'high';

export interface PredictionResult {
  scenario: PredictionScenario;
  /** Predicted time of the next feed. Null when the baby is sleeping (no
   *  feed prediction is shown in that case). */
  nextAt: Date | null;
  /** The interval the prediction used (minutes). */
  intervalMinutes: number;
  /** Confidence level — drives whether to show the "패턴 학습 중" hint. */
  confidence: PredictionConfidence;
  /** How many personal feed events were used to build the prediction. */
  basedOnFeedCount: number;
  /** Last feed event used as the anchor, or null if the baby has never fed. */
  lastFeedAt: Date | null;
  /** Active sleep event, when the scenario is 'sleeping'. */
  activeSleepStartedAt: Date | null;
}

/**
 * Window of recent feeds used to compute the personal average. Larger windows
 * smooth out outliers but lag genuine pattern shifts (e.g., growth spurts);
 * 10 events is roughly one day of newborn feeds and balances both.
 */
const PERSONAL_WINDOW = 10;

/**
 * τ blending weights — how much to lean on the population standard vs. the
 * baby's personal pattern, as a function of how much personal data exists.
 *
 * Heavy reliance on the standard early on protects against noisy first-week
 * data; we shift toward personal as the data accumulates.
 */
function blendingTau(feedCount: number): number {
  if (feedCount < 4) return 1.0; // standard only
  if (feedCount < 7) return 0.5;
  if (feedCount < 14) return 0.3;
  return 0.2;
}

/** Maps feed count to the user-visible confidence level. */
function confidenceFromCount(feedCount: number): PredictionConfidence {
  if (feedCount < 4) return 'learning';
  if (feedCount < 7) return 'low';
  if (feedCount < 14) return 'medium';
  return 'high';
}

/** Average gap (minutes) between consecutive feeds in the most recent window. */
function personalAverageInterval(feeds: readonly TimelineEvent[]): number | null {
  if (feeds.length < 2) return null;

  // Sort ascending then take the last PERSONAL_WINDOW + 1 (we need pairs).
  const sorted = [...feeds].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const window = sorted.slice(-1 * (PERSONAL_WINDOW + 1));

  let totalMinutes = 0;
  for (let i = 1; i < window.length; i += 1) {
    totalMinutes += differenceInMinutes(window[i].startedAt, window[i - 1].startedAt);
  }
  return totalMinutes / (window.length - 1);
}

export interface PredictionInput {
  events: readonly TimelineEvent[];
  babyBirthDate: Date;
  now: Date;
}

/**
 * Predicts the next feed time and derives the home-screen scenario.
 *
 * Sleep takes precedence: if a sleep event is in progress (no endedAt), the
 * scenario is always 'sleeping' and no feed prediction is computed.
 */
export function predictNextFeed(input: PredictionInput): PredictionResult {
  const { events, babyBirthDate, now } = input;

  // Active sleep wins — never show a feed nudge while the baby sleeps.
  const activeSleep = events.find((e) => e.kind === 'sleep' && !e.endedAt);
  if (activeSleep) {
    return {
      scenario: 'sleeping',
      nextAt: null,
      intervalMinutes: 0,
      confidence: 'high',
      basedOnFeedCount: 0,
      lastFeedAt: null,
      activeSleepStartedAt: activeSleep.startedAt,
    };
  }

  const feeds = events.filter((e) => e.kind === 'feed');
  const ageInDays = Math.max(0, differenceInDays(now, babyBirthDate));
  const standard = standardFeedIntervalForAgeDays(ageInDays);
  const personal = personalAverageInterval(feeds);
  const tau = blendingTau(feeds.length);

  const intervalMinutes =
    personal !== null ? Math.round(tau * standard + (1 - tau) * personal) : standard;

  const confidence = confidenceFromCount(feeds.length);

  // No feeds yet: prediction anchors are unavailable. Caller renders the
  // "오늘 첫 수유" empty state.
  if (feeds.length === 0) {
    return {
      scenario: 'normal',
      nextAt: null,
      intervalMinutes,
      confidence,
      basedOnFeedCount: 0,
      lastFeedAt: null,
      activeSleepStartedAt: null,
    };
  }

  const sortedFeeds = [...feeds].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const lastFeed = sortedFeeds[sortedFeeds.length - 1];
  const nextAt = addMinutes(lastFeed.startedAt, intervalMinutes);

  // Scenario thresholds, anchored to the predicted nextAt:
  // - normal:  now is more than 30min before nextAt
  // - warning: now is within ±30min of nextAt
  // - alert:   now is more than 30min past nextAt
  const minutesUntilNext = differenceInMinutes(nextAt, now);

  let scenario: PredictionScenario;
  if (minutesUntilNext > 30) {
    scenario = 'normal';
  } else if (minutesUntilNext > -30) {
    scenario = 'warning';
  } else {
    scenario = 'alert';
  }

  return {
    scenario,
    nextAt,
    intervalMinutes,
    confidence,
    basedOnFeedCount: feeds.length,
    lastFeedAt: lastFeed.startedAt,
    activeSleepStartedAt: null,
  };
}
