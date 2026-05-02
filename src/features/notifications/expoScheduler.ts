import * as Notifications from 'expo-notifications';

import type { NotificationKind, ScheduledNotification, Scheduler } from './types';

/**
 * Production scheduler backed by `expo-notifications`. The id-as-replacement
 * semantics match the in-memory adapter — scheduling a notification with
 * an id that's already pending replaces it.
 *
 * Channel mapping for Android (set up once in setupNotifications()):
 *   normal   → IMPORTANCE_DEFAULT, sound, no DND bypass
 *   warning  → IMPORTANCE_HIGH, sound, no DND bypass
 *   critical → IMPORTANCE_HIGH, sound, DND bypass (안전 경고는 한밤에도 울림)
 */
export function createExpoScheduler(): Scheduler {
  return {
    async schedule(notification: ScheduledNotification) {
      // Replace-by-id: cancel any existing then schedule fresh.
      await Notifications.cancelScheduledNotificationAsync(notification.id).catch(() => {
        /* not scheduled — fine */
      });
      const triggerAtMs = notification.triggerAt.getTime();
      const now = Date.now();
      // expo-notifications rejects past timestamps. If the predicted
      // time has already passed, fire immediately (caregivers shouldn't
      // miss a critical alert because the trigger lapsed by 1 second).
      const trigger =
        triggerAtMs <= now
          ? null
          : ({
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notification.triggerAt,
              channelId: notification.channel,
            } satisfies Notifications.NotificationTriggerInput);

      await Notifications.scheduleNotificationAsync({
        identifier: notification.id,
        content: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
        },
        trigger,
      });
    },

    async cancel(id: NotificationKind) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {
        /* not scheduled — fine */
      });
    },

    async cancelAll() {
      await Notifications.cancelAllScheduledNotificationsAsync();
    },

    async list() {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      return all
        .filter((n): n is typeof n & { identifier: NotificationKind } =>
          ['feed-reminder', 'sleep-cue-reminder', 'feed-4h-warning', 'nap-too-long', 'low-diaper-count'].includes(
            n.identifier,
          ),
        )
        .map((n) => {
          const triggerInput = n.trigger as
            | (Notifications.NotificationTriggerInput & { date?: Date | number })
            | null;
          const triggerAt =
            triggerInput && typeof triggerInput === 'object' && 'date' in triggerInput
              ? new Date(triggerInput.date as number | Date)
              : new Date();
          return {
            id: n.identifier,
            channel: 'normal' as const, // OS-level only; we don't read it back
            title: n.content.title ?? '',
            body: n.content.body ?? '',
            triggerAt,
          };
        });
    },
  };
}
