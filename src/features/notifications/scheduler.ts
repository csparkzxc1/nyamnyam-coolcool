/**
 * Feed/sleep/safety reminder scheduling — turns prediction + anomaly
 * outputs into concrete notification entries.
 *
 * Pure logic; the Scheduler interface is injected so this whole module
 * unit-tests with `createInMemoryScheduler()` and never touches
 * expo-notifications.
 *
 * Spec (PRD + IMPLEMENTATION_PLAN T602/T603):
 *   - 수유 예상 10분 전 → normal channel
 *   - 수면 예상 15분 전 → normal channel
 *   - 0~1m baby + 4시간 후 마지막 수유 → critical channel
 *   - 낮잠 2.5h 초과 → warning channel
 *   - 24h 소변 기저귀 < 6장 → warning/critical (severity-driven)
 *   - 방해금지 시간(22~6)에는 critical만 통과
 */
import { addMinutes, differenceInMinutes } from 'date-fns';

import type { Anomaly } from '@/features/anomalies/detect';

import type {
  NotificationChannel,
  NotificationKind,
  ScheduledNotification,
  Scheduler,
} from './types';

const FEED_LEAD_MINUTES = 10;
const SLEEP_LEAD_MINUTES = 15;
const FOUR_HOUR_MINUTES = 240;

export interface DndWindow {
  /** Inclusive start hour (0–23). */
  startHour: number;
  /** Exclusive end hour (0–23). */
  endHour: number;
}

export interface ScheduleSettings {
  /** Master switch — if false, all reminders are cancelled, none scheduled. */
  enabled: boolean;
  /** Per-category opt-out for predicted reminders. */
  feedRemindersEnabled: boolean;
  sleepRemindersEnabled: boolean;
  /** "방해 금지" window. Only critical reminders fire inside this window. */
  dnd: DndWindow;
}

export const DEFAULT_SETTINGS: ScheduleSettings = {
  enabled: true,
  feedRemindersEnabled: true,
  sleepRemindersEnabled: true,
  dnd: { startHour: 22, endHour: 6 },
};

/** True when `at` falls inside a window that may wrap past midnight. */
export function isInDndWindow(at: Date, dnd: DndWindow): boolean {
  const h = at.getHours();
  if (dnd.startHour === dnd.endHour) return false;
  if (dnd.startHour < dnd.endHour) {
    return h >= dnd.startHour && h < dnd.endHour;
  }
  // Wraps midnight: [start, 24) ∪ [0, end)
  return h >= dnd.startHour || h < dnd.endHour;
}

export interface FeedReminderInput {
  babyName: string;
  /** Predicted next feed time. Skip if null/past or null. */
  nextFeedAt: Date | null;
  /** Last feed timestamp; needed for the 4-hour newborn rule. */
  lastFeedAt: Date | null;
  /** Months old. Newborns trigger the 4-hour critical rule when ≤1. */
  ageMonths: number;
  now: Date;
  settings: ScheduleSettings;
}

export function buildFeedReminders(input: FeedReminderInput): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  if (!input.settings.enabled) return out;

  // Feed prediction reminder
  if (input.settings.feedRemindersEnabled && input.nextFeedAt) {
    const triggerAt = addMinutes(input.nextFeedAt, -FEED_LEAD_MINUTES);
    if (triggerAt > input.now && !isInDndWindow(triggerAt, input.settings.dnd)) {
      out.push({
        id: 'feed-reminder',
        channel: 'normal',
        title: '🍼 곧 수유 시간이에요',
        body: `${input.babyName}이(가) 곧 배고파할 시간이에요`,
        triggerAt,
      });
    }
  }

  // 0~1m newborn + last feed: schedule critical at +4h (or fire-now-if-past)
  if (input.ageMonths <= 1 && input.lastFeedAt) {
    const fourHourMark = addMinutes(input.lastFeedAt, FOUR_HOUR_MINUTES);
    if (fourHourMark > input.now) {
      // Critical channel bypasses DND — no DND check.
      out.push({
        id: 'feed-4h-warning',
        channel: 'critical',
        title: '⚠️ 깨워서 수유해 주세요',
        body: `${input.babyName}이(가) 마지막 수유 후 4시간이 다가와요. 깨워서 수유해 주세요.`,
        triggerAt: fourHourMark,
      });
    }
  }

  return out;
}

export interface SleepReminderInput {
  babyName: string;
  /** Predicted next sleep window start, or null when not predictable. */
  nextSleepAt: Date | null;
  now: Date;
  settings: ScheduleSettings;
}

export function buildSleepReminders(input: SleepReminderInput): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  if (!input.settings.enabled || !input.settings.sleepRemindersEnabled || !input.nextSleepAt) {
    return out;
  }
  const triggerAt = addMinutes(input.nextSleepAt, -SLEEP_LEAD_MINUTES);
  if (triggerAt <= input.now) return out;
  if (isInDndWindow(triggerAt, input.settings.dnd)) return out;
  out.push({
    id: 'sleep-cue-reminder',
    channel: 'normal',
    title: '😴 졸림 신호가 나올 시간이에요',
    body: `${input.babyName}이(가) 곧 졸려할 거예요. 재우기 좋은 환경을 준비해 보세요.`,
    triggerAt,
  });
  return out;
}

const ANOMALY_KIND: Partial<Record<Anomaly['code'], NotificationKind>> = {
  NAP_TOO_LONG: 'nap-too-long',
  LOW_DIAPER_COUNT: 'low-diaper-count',
};

const ANOMALY_CHANNEL: Record<Anomaly['severity'], NotificationChannel> = {
  info: 'normal',
  warning: 'warning',
  critical: 'critical',
};

export function buildAnomalyReminders(
  anomalies: readonly Anomaly[],
  settings: ScheduleSettings,
  now: Date,
): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  if (!settings.enabled) return out;
  for (const a of anomalies) {
    const id = ANOMALY_KIND[a.code];
    if (!id) continue;
    // Anomaly notifications fire immediately (1 second from now) so the
    // OS has a future trigger point. Critical bypasses DND; non-critical
    // is suppressed during DND.
    const channel = ANOMALY_CHANNEL[a.severity];
    if (channel !== 'critical' && isInDndWindow(now, settings.dnd)) continue;
    out.push({
      id,
      channel,
      title: a.message,
      body: a.detail,
      triggerAt: new Date(now.getTime() + 1000),
    });
  }
  return out;
}

/**
 * Apply a freshly-built notification list to the OS scheduler:
 *   1. Cancel every managed id that is NOT in the new list
 *   2. (Re-)schedule each entry in the new list (replace by id)
 *
 * Replace-by-id matters because scheduling a never-before-used id is
 * cheap, but leaving stale notifications would surface yesterday's
 * predictions tomorrow.
 */
const ALL_KINDS: readonly NotificationKind[] = [
  'feed-reminder',
  'sleep-cue-reminder',
  'feed-4h-warning',
  'nap-too-long',
  'low-diaper-count',
];

export async function applyNotifications(
  scheduler: Scheduler,
  desired: readonly ScheduledNotification[],
): Promise<void> {
  const desiredIds = new Set(desired.map((d) => d.id));
  for (const id of ALL_KINDS) {
    if (!desiredIds.has(id)) {
      await scheduler.cancel(id);
    }
  }
  for (const n of desired) {
    await scheduler.schedule(n);
  }
}
