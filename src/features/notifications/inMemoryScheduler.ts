import type { NotificationKind, ScheduledNotification, Scheduler } from './types';

/**
 * In-memory scheduler used by unit tests + as a fallback when
 * notifications are disabled (permission denied / system off).
 *
 * Same surface as the Expo adapter so swap-out is trivial:
 * `createInMemoryScheduler()` returns a Scheduler, period.
 */
export function createInMemoryScheduler(): Scheduler & {
  /** Test-only: fire callbacks for the next-due notification. */
  __debug__getMap(): Map<NotificationKind, ScheduledNotification>;
} {
  const queue = new Map<NotificationKind, ScheduledNotification>();

  return {
    async schedule(notification) {
      queue.set(notification.id, notification);
    },
    async cancel(id) {
      queue.delete(id);
    },
    async cancelAll() {
      queue.clear();
    },
    async list() {
      return Array.from(queue.values());
    },
    __debug__getMap() {
      return queue;
    },
  };
}
