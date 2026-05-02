/**
 * Internal notification model — independent of expo-notifications so the
 * scheduling logic stays unit-testable without native modules.
 *
 * Channels mirror the Android notification channel design: each app
 * notification is dispatched onto exactly one channel, and the
 * channel's importance + sound + DND-bypass policy is enforced by
 * the OS.
 */

export type NotificationChannel = 'normal' | 'warning' | 'critical';

export type NotificationKind =
  /** Predicted feed reminder (T-10 minutes). */
  | 'feed-reminder'
  /** Predicted nap/night sleep nudge (T-15 minutes from sleep window). */
  | 'sleep-cue-reminder'
  /** Safety alert: 0~1m baby past 4-hour feeding window. */
  | 'feed-4h-warning'
  /** Safety alert: nap exceeded 2.5 hours. */
  | 'nap-too-long'
  /** Safety alert: 24h wet diaper count below threshold. */
  | 'low-diaper-count';

export interface ScheduledNotification {
  /** Stable id — re-using the same id replaces the previously-scheduled one. */
  id: NotificationKind;
  channel: NotificationChannel;
  title: string;
  body: string;
  /** When the OS should fire the notification. */
  triggerAt: Date;
}

/**
 * Adapter contract — the in-app code talks to the Scheduler interface,
 * not directly to expo-notifications. Production wires up
 * `createExpoScheduler()`; tests use `createInMemoryScheduler()`.
 */
export interface Scheduler {
  /** Replace any pending notification with the same id. */
  schedule(notification: ScheduledNotification): Promise<void>;
  /** Cancel a notification by id; no-op if not scheduled. */
  cancel(id: NotificationKind): Promise<void>;
  /** Cancel all notifications managed by this scheduler. */
  cancelAll(): Promise<void>;
  /** Inspect what is currently scheduled (used in tests + DevTools). */
  list(): Promise<ScheduledNotification[]>;
}
