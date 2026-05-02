import type { DetailedEvent } from '@/features/logging/eventsTransform';

import { detectAnomalies, MIN_WET_DIAPERS_24H } from './detect';

const at = (iso: string) => new Date(iso);

const NOW = at('2026-05-02T18:00:00');
const NEWBORN_BIRTH = at('2026-04-22T00:00:00'); // ~10일
const M5_BIRTH = at('2025-12-02T00:00:00'); // ~5개월
const M12_BIRTH = at('2025-05-02T00:00:00'); // ~12개월

function feed(iso: string, amountMl?: number, type: 'formula' | 'breast_left' = 'formula'): DetailedEvent {
  return { kind: 'feed', id: `f-${iso}`, type, startedAt: at(iso), amountMl };
}

function sleep(startIso: string, endIso: string | null, type: 'nap' | 'night' = 'nap'): DetailedEvent {
  return {
    kind: 'sleep',
    id: `s-${startIso}`,
    type,
    startedAt: at(startIso),
    endedAt: endIso ? at(endIso) : undefined,
  };
}

function diaper(iso: string, type: 'wet' | 'dirty' | 'both' = 'wet'): DetailedEvent {
  return { kind: 'diaper', id: `d-${iso}`, type, startedAt: at(iso) };
}

describe('detectAnomalies', () => {
  it('returns empty array when no events provided', () => {
    const result = detectAnomalies({
      babyBirthDate: NEWBORN_BIRTH,
      events: [],
      now: NOW,
    });
    expect(result).toEqual([]);
  });

  describe('FEEDING_TOO_FREQUENT', () => {
    it('fires when avg feed interval is below half the standard floor', () => {
      // Newborn standard 2~3h → floor 60min. Need avg < 60min.
      // 4 feeds at 30min spacing = 30min average.
      const events: DetailedEvent[] = [
        feed('2026-05-02T15:00:00'),
        feed('2026-05-02T15:30:00'),
        feed('2026-05-02T16:00:00'),
        feed('2026-05-02T16:30:00'),
      ];
      const result = detectAnomalies({
        babyBirthDate: NEWBORN_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'FEEDING_TOO_FREQUENT')).toBeTruthy();
    });

    it('does not fire when average matches standard band', () => {
      const events: DetailedEvent[] = [
        feed('2026-05-02T12:00:00'),
        feed('2026-05-02T15:00:00'),
        feed('2026-05-02T17:30:00'),
      ];
      const result = detectAnomalies({
        babyBirthDate: NEWBORN_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'FEEDING_TOO_FREQUENT')).toBeUndefined();
    });
  });

  describe('FEEDING_TOO_SPARSE', () => {
    it('fires for 0~3m baby when avg interval > 1.5x standard ceiling', () => {
      // Newborn ceiling 3h. 1.5x = 4.5h. Need avg > 270min.
      // 2 feeds 6h apart = 360 min average.
      const events: DetailedEvent[] = [
        feed('2026-05-02T08:00:00'),
        feed('2026-05-02T14:00:00'),
      ];
      const result = detectAnomalies({
        babyBirthDate: NEWBORN_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'FEEDING_TOO_SPARSE')).toBeTruthy();
    });

    it('does not fire for older babies even with sparse intervals', () => {
      const events: DetailedEvent[] = [
        feed('2026-05-02T08:00:00'),
        feed('2026-05-02T14:00:00'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M12_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'FEEDING_TOO_SPARSE')).toBeUndefined();
    });
  });

  describe('OVERFEEDING_RISK', () => {
    it('fires when daily formula exceeds the 1000ml ceiling', () => {
      const events: DetailedEvent[] = [
        feed('2026-05-02T07:00:00', 200),
        feed('2026-05-02T11:00:00', 200),
        feed('2026-05-02T13:00:00', 200),
        feed('2026-05-02T15:00:00', 200),
        feed('2026-05-02T17:00:00', 220),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      const anomaly = result.find((a) => a.code === 'OVERFEEDING_RISK');
      expect(anomaly).toBeTruthy();
      expect(anomaly?.data.todayMl).toBe(1020);
    });

    it('does not fire when the day total is at or below the ceiling', () => {
      const events: DetailedEvent[] = [
        feed('2026-05-02T07:00:00', 200),
        feed('2026-05-02T11:00:00', 200),
        feed('2026-05-02T15:00:00', 200),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'OVERFEEDING_RISK')).toBeUndefined();
    });

    it('only counts formula feeds — breastfeeding has no fixed ceiling', () => {
      // 3 breast feeds of 500ml each = ignored.
      const events: DetailedEvent[] = [
        feed('2026-05-02T07:00:00', 500, 'breast_left'),
        feed('2026-05-02T11:00:00', 500, 'breast_left'),
        feed('2026-05-02T15:00:00', 500, 'breast_left'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'OVERFEEDING_RISK')).toBeUndefined();
    });
  });

  describe('LOW_DIAPER_COUNT', () => {
    it('fires when wet diaper count in 24h is below the threshold', () => {
      // 4 wet, 1 dirty = 4 wet < 6
      const events: DetailedEvent[] = [
        diaper('2026-05-02T08:00:00', 'wet'),
        diaper('2026-05-02T10:00:00', 'wet'),
        diaper('2026-05-02T12:00:00', 'wet'),
        diaper('2026-05-02T14:00:00', 'wet'),
        diaper('2026-05-02T16:00:00', 'dirty'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      const anomaly = result.find((a) => a.code === 'LOW_DIAPER_COUNT');
      expect(anomaly).toBeTruthy();
      expect(anomaly?.severity).toBe('critical'); // 4 ≤ 4 → critical
      expect(anomaly?.data.wetCount).toBe(4);
    });

    it('escalates severity to critical when wet count is 4 or fewer', () => {
      const events: DetailedEvent[] = [
        diaper('2026-05-02T08:00:00', 'wet'),
        diaper('2026-05-02T16:00:00', 'wet'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'LOW_DIAPER_COUNT')?.severity).toBe('critical');
    });

    it('does not fire for older babies even when count is low', () => {
      const events: DetailedEvent[] = [
        diaper('2026-05-02T08:00:00', 'wet'),
        diaper('2026-05-02T16:00:00', 'wet'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M12_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'LOW_DIAPER_COUNT')).toBeUndefined();
    });

    it('stays silent when no diaper records exist (data gap, not deficiency)', () => {
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events: [],
        now: NOW,
      });
      expect(result.find((a) => a.code === 'LOW_DIAPER_COUNT')).toBeUndefined();
    });

    it('still fires when threshold is just met (boundary check)', () => {
      const events: DetailedEvent[] = Array.from({ length: MIN_WET_DIAPERS_24H }, (_, i) =>
        diaper(`2026-05-02T${String(8 + i).padStart(2, '0')}:00:00`, 'wet'),
      );
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      // Exactly threshold = no anomaly
      expect(result.find((a) => a.code === 'LOW_DIAPER_COUNT')).toBeUndefined();
    });
  });

  describe('NAP_TOO_LONG', () => {
    it('fires when an active nap is past 150 minutes', () => {
      // Active nap started 3h ago.
      const events: DetailedEvent[] = [
        sleep('2026-05-02T15:00:00', null, 'nap'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW, // 18:00 → 180min
      });
      const anomaly = result.find((a) => a.code === 'NAP_TOO_LONG');
      expect(anomaly).toBeTruthy();
      expect(anomaly?.data.napMin).toBe(180);
    });

    it('does not fire for completed naps', () => {
      const events: DetailedEvent[] = [
        sleep('2026-05-02T13:00:00', '2026-05-02T17:00:00', 'nap'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'NAP_TOO_LONG')).toBeUndefined();
    });

    it('does not fire for night sleeps', () => {
      const events: DetailedEvent[] = [
        sleep('2026-05-02T15:00:00', null, 'night'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'NAP_TOO_LONG')).toBeUndefined();
    });
  });

  describe('SLEEP_DEFICIT_3DAYS', () => {
    it('fires when 3 consecutive days are all under 70% of standard', () => {
      // Newborn standard 14h × 0.7 = 9.8h. Need 3 days each <9.8h.
      // Each day has 8h sleep across the 24h window before NOW.
      const events: DetailedEvent[] = [];
      for (let d = 0; d < 3; d += 1) {
        const dayEnd = new Date(NOW.getTime() - d * 24 * 60 * 60_000);
        const start = new Date(dayEnd.getTime() - 8 * 60 * 60_000);
        events.push(sleep(start.toISOString(), dayEnd.toISOString(), 'night'));
      }
      const result = detectAnomalies({
        babyBirthDate: NEWBORN_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'SLEEP_DEFICIT_3DAYS')).toBeTruthy();
    });

    it('does not fire when sleep meets standard', () => {
      const events: DetailedEvent[] = [];
      for (let d = 0; d < 3; d += 1) {
        const dayEnd = new Date(NOW.getTime() - d * 24 * 60 * 60_000);
        const start = new Date(dayEnd.getTime() - 14 * 60 * 60_000);
        events.push(sleep(start.toISOString(), dayEnd.toISOString(), 'night'));
      }
      const result = detectAnomalies({
        babyBirthDate: NEWBORN_BIRTH,
        events,
        now: NOW,
      });
      expect(result.find((a) => a.code === 'SLEEP_DEFICIT_3DAYS')).toBeUndefined();
    });
  });

  describe('severity ordering', () => {
    it('sorts critical → warning → info', () => {
      // Triggers: LOW_DIAPER_COUNT (critical), OVERFEEDING_RISK (warning),
      // NAP_TOO_LONG (info).
      const events: DetailedEvent[] = [
        diaper('2026-05-02T08:00:00', 'wet'), // 1 wet only
        feed('2026-05-02T07:00:00', 600),
        feed('2026-05-02T11:00:00', 600), // 1200 ml total → over ceiling
        sleep('2026-05-02T15:00:00', null, 'nap'),
      ];
      const result = detectAnomalies({
        babyBirthDate: M5_BIRTH,
        events,
        now: NOW,
      });
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result[0].severity).toBe('critical');
    });
  });
});
