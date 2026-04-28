import { predictNextFeed, type PredictionConfidence, type PredictionScenario } from './prediction';

import type { TimelineEvent } from './timelineEvents';

const babyBirthDate = new Date('2026-03-12T00:00:00');
const now = new Date('2026-04-28T15:00:00');

function feedAt(iso: string, id = `f-${iso}`): TimelineEvent {
  return { id, kind: 'feed', startedAt: new Date(iso) };
}

function sleepAt(startIso: string, endIso: string | null, id = `s-${startIso}`): TimelineEvent {
  return {
    id,
    kind: 'sleep',
    startedAt: new Date(startIso),
    endedAt: endIso ? new Date(endIso) : undefined,
  };
}

describe('predictNextFeed', () => {
  describe('sleeping scenario', () => {
    it('returns sleeping when an active sleep is in progress', () => {
      const result = predictNextFeed({
        events: [sleepAt('2026-04-28T14:30:00', null)],
        babyBirthDate,
        now,
      });
      expect(result.scenario).toBe<PredictionScenario>('sleeping');
      expect(result.nextAt).toBeNull();
      expect(result.activeSleepStartedAt).toEqual(new Date('2026-04-28T14:30:00'));
    });

    it('does not look at feeds when sleep is active', () => {
      const result = predictNextFeed({
        events: [feedAt('2026-04-28T13:00:00'), sleepAt('2026-04-28T14:30:00', null)],
        babyBirthDate,
        now,
      });
      expect(result.scenario).toBe<PredictionScenario>('sleeping');
      expect(result.lastFeedAt).toBeNull();
    });
  });

  describe('no feeds yet', () => {
    it('returns normal with no nextAt when there are zero feeds', () => {
      const result = predictNextFeed({
        events: [],
        babyBirthDate,
        now,
      });
      expect(result.scenario).toBe<PredictionScenario>('normal');
      expect(result.nextAt).toBeNull();
      expect(result.basedOnFeedCount).toBe(0);
      expect(result.confidence).toBe<PredictionConfidence>('learning');
    });
  });

  describe('confidence thresholds', () => {
    it('returns "learning" when count is under 4', () => {
      const events = [feedAt('2026-04-28T10:00:00')];
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.confidence).toBe<PredictionConfidence>('learning');
    });

    it('returns "low" when count is 4-6', () => {
      const events = Array.from({ length: 5 }, (_, i) => feedAt(`2026-04-28T0${i + 6}:00:00`));
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.confidence).toBe<PredictionConfidence>('low');
    });

    it('returns "medium" when count is 7-13', () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        feedAt(
          `2026-04-${String(20 + Math.floor(i / 3)).padStart(2, '0')}T0${(i % 6) + 6}:00:00`,
          `f-${i}`,
        ),
      );
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.confidence).toBe<PredictionConfidence>('medium');
    });

    it('returns "high" when count is 14+', () => {
      const events = Array.from({ length: 20 }, (_, i) =>
        feedAt(
          `2026-04-${String(15 + Math.floor(i / 4)).padStart(2, '0')}T0${(i % 5) + 6}:00:00`,
          `f-${i}`,
        ),
      );
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.confidence).toBe<PredictionConfidence>('high');
    });
  });

  describe('scenario thresholds', () => {
    // Setup: create one feed event that's 1 hour ago. Standard for ~1.5 month
    // baby is 180 min, so nextAt = lastFeed + 180 = 14:00 + 3h = 17:00.
    // - now=15:00 → 120 min until next → normal
    const oneFeed = [feedAt('2026-04-28T14:00:00')];

    it('normal when more than 30 min before nextAt', () => {
      const result = predictNextFeed({
        events: oneFeed,
        babyBirthDate,
        now: new Date('2026-04-28T15:00:00'),
      });
      expect(result.scenario).toBe<PredictionScenario>('normal');
    });

    it('warning when within 30 min of nextAt', () => {
      // nextAt = 17:00, now = 16:45 → 15 min until, warning
      const result = predictNextFeed({
        events: oneFeed,
        babyBirthDate,
        now: new Date('2026-04-28T16:45:00'),
      });
      expect(result.scenario).toBe<PredictionScenario>('warning');
    });

    it('alert when more than 30 min past nextAt', () => {
      // nextAt = 17:00, now = 18:00 → -60 min, alert
      const result = predictNextFeed({
        events: oneFeed,
        babyBirthDate,
        now: new Date('2026-04-28T18:00:00'),
      });
      expect(result.scenario).toBe<PredictionScenario>('alert');
    });
  });

  describe('blending', () => {
    it('uses standard only when feed count < 4 (tau=1.0)', () => {
      // Personal would be 60 min between feeds, but standard wins.
      const events = [feedAt('2026-04-28T13:00:00', 'a'), feedAt('2026-04-28T14:00:00', 'b')];
      const result = predictNextFeed({ events, babyBirthDate, now });
      // ~1.5 month → 180 min standard
      expect(result.intervalMinutes).toBe(180);
    });

    it('blends with personal when feed count >= 4', () => {
      // Five feeds spaced 60 min apart → personal=60. Standard=180.
      // tau=0.5 → blended = 0.5*180 + 0.5*60 = 120
      const events = Array.from({ length: 5 }, (_, i) =>
        feedAt(`2026-04-28T${String(8 + i).padStart(2, '0')}:00:00`, `f-${i}`),
      );
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.intervalMinutes).toBe(120);
    });
  });

  describe('lastFeedAt', () => {
    it('returns the most recent feed timestamp', () => {
      const events = [
        feedAt('2026-04-28T08:00:00', 'a'),
        feedAt('2026-04-28T10:30:00', 'b'),
        feedAt('2026-04-28T13:00:00', 'c'),
      ];
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.lastFeedAt).toEqual(new Date('2026-04-28T13:00:00'));
    });

    it('handles unsorted event lists', () => {
      const events = [
        feedAt('2026-04-28T13:00:00', 'c'),
        feedAt('2026-04-28T08:00:00', 'a'),
        feedAt('2026-04-28T10:30:00', 'b'),
      ];
      const result = predictNextFeed({ events, babyBirthDate, now });
      expect(result.lastFeedAt).toEqual(new Date('2026-04-28T13:00:00'));
    });
  });
});
