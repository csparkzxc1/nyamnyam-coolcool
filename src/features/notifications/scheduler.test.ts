import type { Anomaly } from '@/features/anomalies/detect';

import { createInMemoryScheduler } from './inMemoryScheduler';
import {
  applyNotifications,
  buildAnomalyReminders,
  buildFeedReminders,
  buildSleepReminders,
  DEFAULT_SETTINGS,
  isInDndWindow,
} from './scheduler';

const NOW = new Date('2026-05-02T14:00:00');
const baby = '윤서아';

describe('isInDndWindow', () => {
  const dnd = { startHour: 22, endHour: 6 };

  it('detects late-night hours', () => {
    expect(isInDndWindow(new Date('2026-05-02T23:00:00'), dnd)).toBe(true);
  });

  it('detects early-morning hours', () => {
    expect(isInDndWindow(new Date('2026-05-02T05:30:00'), dnd)).toBe(true);
  });

  it('returns false during the day', () => {
    expect(isInDndWindow(new Date('2026-05-02T10:00:00'), dnd)).toBe(false);
  });

  it('handles non-wrapping windows (start < end)', () => {
    const day = { startHour: 9, endHour: 17 };
    expect(isInDndWindow(new Date('2026-05-02T10:00:00'), day)).toBe(true);
    expect(isInDndWindow(new Date('2026-05-02T18:00:00'), day)).toBe(false);
  });

  it('returns false when start equals end (window disabled)', () => {
    const off = { startHour: 0, endHour: 0 };
    expect(isInDndWindow(new Date('2026-05-02T03:00:00'), off)).toBe(false);
  });
});

describe('buildFeedReminders', () => {
  it('schedules a feed reminder 10 min before next feed', () => {
    const nextFeedAt = new Date('2026-05-02T15:00:00');
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt,
      lastFeedAt: new Date('2026-05-02T12:00:00'),
      ageMonths: 6,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    const feed = result.find((n) => n.id === 'feed-reminder');
    expect(feed).toBeTruthy();
    expect(nextFeedAt.getTime() - (feed?.triggerAt.getTime() ?? 0)).toBe(10 * 60_000);
    expect(feed?.channel).toBe('normal');
  });

  it('skips the feed reminder when nextFeedAt has already passed', () => {
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt: new Date('2026-05-02T12:00:00'), // past
      lastFeedAt: new Date('2026-05-02T10:00:00'),
      ageMonths: 6,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    expect(result.find((n) => n.id === 'feed-reminder')).toBeUndefined();
  });

  it('skips when feedRemindersEnabled is false', () => {
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt: new Date('2026-05-02T15:00:00'),
      lastFeedAt: null,
      ageMonths: 6,
      now: NOW,
      settings: { ...DEFAULT_SETTINGS, feedRemindersEnabled: false },
    });
    expect(result).toEqual([]);
  });

  it('schedules a 4-hour critical alert for newborns', () => {
    const lastFeedAt = new Date('2026-05-02T13:00:00');
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt: null,
      lastFeedAt,
      ageMonths: 1,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    const critical = result.find((n) => n.id === 'feed-4h-warning');
    expect(critical?.channel).toBe('critical');
    expect((critical?.triggerAt.getTime() ?? 0) - lastFeedAt.getTime()).toBe(4 * 60 * 60_000);
  });

  it('does not schedule the 4-hour rule for older babies', () => {
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt: null,
      lastFeedAt: new Date('2026-05-02T13:00:00'),
      ageMonths: 4,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    expect(result.find((n) => n.id === 'feed-4h-warning')).toBeUndefined();
  });

  it('suppresses non-critical feed reminders inside DND', () => {
    // Trigger lands at 22:50 inside DND; should be suppressed.
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt: new Date('2026-05-02T23:00:00'),
      lastFeedAt: null,
      ageMonths: 6,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    expect(result.find((n) => n.id === 'feed-reminder')).toBeUndefined();
  });

  it('schedules the 4-hour critical even when it lands inside DND', () => {
    // Last feed at 21:00, 4h mark = 01:00 (inside DND). Critical should fire.
    const result = buildFeedReminders({
      babyName: baby,
      nextFeedAt: null,
      lastFeedAt: new Date('2026-05-02T21:00:00'),
      ageMonths: 1,
      now: new Date('2026-05-02T22:30:00'),
      settings: DEFAULT_SETTINGS,
    });
    expect(result.find((n) => n.id === 'feed-4h-warning')).toBeTruthy();
  });
});

describe('buildSleepReminders', () => {
  it('schedules 15 min before predicted sleep', () => {
    const nextSleepAt = new Date('2026-05-02T15:30:00');
    const result = buildSleepReminders({
      babyName: baby,
      nextSleepAt,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    expect(result[0]?.id).toBe('sleep-cue-reminder');
    expect(nextSleepAt.getTime() - result[0].triggerAt.getTime()).toBe(15 * 60_000);
  });

  it('skips when nextSleepAt is null', () => {
    const result = buildSleepReminders({
      babyName: baby,
      nextSleepAt: null,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    expect(result).toEqual([]);
  });

  it('skips when sleepRemindersEnabled is false', () => {
    const result = buildSleepReminders({
      babyName: baby,
      nextSleepAt: new Date('2026-05-02T15:30:00'),
      now: NOW,
      settings: { ...DEFAULT_SETTINGS, sleepRemindersEnabled: false },
    });
    expect(result).toEqual([]);
  });
});

describe('buildAnomalyReminders', () => {
  const napAnomaly: Anomaly = {
    code: 'NAP_TOO_LONG',
    severity: 'info',
    message: '낮잠이 180분째예요',
    detail: '...',
    data: { napMin: 180 },
  };

  const diaperCritical: Anomaly = {
    code: 'LOW_DIAPER_COUNT',
    severity: 'critical',
    message: '24시간 소변 기저귀 3장',
    detail: '...',
    data: { wetCount: 3 },
  };

  it('maps anomaly code → notification id', () => {
    const result = buildAnomalyReminders([napAnomaly], DEFAULT_SETTINGS, NOW);
    expect(result[0]?.id).toBe('nap-too-long');
  });

  it('uses the warning channel for warning severity', () => {
    const warn: Anomaly = { ...diaperCritical, severity: 'warning' };
    const result = buildAnomalyReminders([warn], DEFAULT_SETTINGS, NOW);
    expect(result[0]?.channel).toBe('warning');
  });

  it('uses the critical channel for critical severity', () => {
    const result = buildAnomalyReminders([diaperCritical], DEFAULT_SETTINGS, NOW);
    expect(result[0]?.channel).toBe('critical');
  });

  it('suppresses non-critical anomalies in DND, lets critical through', () => {
    const dndNow = new Date('2026-05-02T23:00:00');
    const result = buildAnomalyReminders([napAnomaly, diaperCritical], DEFAULT_SETTINGS, dndNow);
    expect(result.find((n) => n.id === 'nap-too-long')).toBeUndefined();
    expect(result.find((n) => n.id === 'low-diaper-count')).toBeTruthy();
  });

  it('skips entirely when scheduler is disabled', () => {
    const result = buildAnomalyReminders(
      [diaperCritical],
      { ...DEFAULT_SETTINGS, enabled: false },
      NOW,
    );
    expect(result).toEqual([]);
  });
});

describe('applyNotifications', () => {
  it('schedules each desired entry on the scheduler', async () => {
    const scheduler = createInMemoryScheduler();
    const desired = buildSleepReminders({
      babyName: baby,
      nextSleepAt: new Date('2026-05-02T15:30:00'),
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    await applyNotifications(scheduler, desired);
    const all = await scheduler.list();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('sleep-cue-reminder');
  });

  it('cancels stale ids that are no longer in the desired list', async () => {
    const scheduler = createInMemoryScheduler();
    await scheduler.schedule({
      id: 'feed-reminder',
      channel: 'normal',
      title: 'old',
      body: 'old',
      triggerAt: new Date('2026-05-02T15:00:00'),
    });
    await applyNotifications(scheduler, []);
    const all = await scheduler.list();
    expect(all).toHaveLength(0);
  });

  it('replaces an existing notification with the same id', async () => {
    const scheduler = createInMemoryScheduler();
    await scheduler.schedule({
      id: 'feed-reminder',
      channel: 'normal',
      title: 'old',
      body: 'old',
      triggerAt: new Date('2026-05-02T14:50:00'),
    });
    const nextFeedAt = new Date('2026-05-02T15:30:00');
    const fresh = buildFeedReminders({
      babyName: baby,
      nextFeedAt,
      lastFeedAt: null,
      ageMonths: 4,
      now: NOW,
      settings: DEFAULT_SETTINGS,
    });
    await applyNotifications(scheduler, fresh);
    const all = await scheduler.list();
    const reminder = all.find((n) => n.id === 'feed-reminder');
    expect(reminder?.title).not.toBe('old');
    expect(nextFeedAt.getTime() - (reminder?.triggerAt.getTime() ?? 0)).toBe(10 * 60_000);
  });
});
