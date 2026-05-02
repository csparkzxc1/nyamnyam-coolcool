/**
 * Runtime scheduler singleton + the React hook that consumers call to
 * keep their reminders in sync.
 *
 * The actual adapter (expo-notifications vs in-memory) is bound once at
 * app boot via `installScheduler()`. Until installed, calls are no-ops
 * — keeps tests and SSR safe.
 */
import { useEffect } from 'react';

import type { Anomaly } from '@/features/anomalies/detect';

import { createInMemoryScheduler } from './inMemoryScheduler';
import {
  applyNotifications,
  buildAnomalyReminders,
  buildFeedReminders,
  buildSleepReminders,
  type ScheduleSettings,
} from './scheduler';

import type { Scheduler } from './types';

let activeScheduler: Scheduler | null = null;

export function installScheduler(scheduler: Scheduler): void {
  activeScheduler = scheduler;
}

export function getScheduler(): Scheduler {
  // Lazy-init with the in-memory adapter when nobody has installed yet
  // — useful for tests + dev when expo-notifications isn't configured.
  if (!activeScheduler) {
    activeScheduler = createInMemoryScheduler();
  }
  return activeScheduler;
}

export interface SyncReminderInput {
  babyName: string;
  ageMonths: number;
  nextFeedAt: Date | null;
  lastFeedAt: Date | null;
  nextSleepAt: Date | null;
  anomalies: readonly Anomaly[];
  settings: ScheduleSettings;
  now: Date;
}

/**
 * One-shot reconcile: build the desired reminder list, then apply.
 * Intended to be called from a useEffect whose deps include all the
 * predictive inputs.
 */
export async function syncReminders(input: SyncReminderInput): Promise<void> {
  const desired = [
    ...buildFeedReminders({
      babyName: input.babyName,
      nextFeedAt: input.nextFeedAt,
      lastFeedAt: input.lastFeedAt,
      ageMonths: input.ageMonths,
      now: input.now,
      settings: input.settings,
    }),
    ...buildSleepReminders({
      babyName: input.babyName,
      nextSleepAt: input.nextSleepAt,
      now: input.now,
      settings: input.settings,
    }),
    ...buildAnomalyReminders(input.anomalies, input.settings, input.now),
  ];
  await applyNotifications(getScheduler(), desired);
}

/**
 * React hook that keeps notifications in sync with predictions +
 * anomalies. Skips entirely when the master `enabled` flag is off
 * (also cancels any pending) so toggling settings has immediate effect.
 */
export function useReminderSync(input: SyncReminderInput | null): void {
  useEffect(() => {
    if (!input) return;
    void syncReminders(input);
    // Object identity is the trigger — callers should pass a memoized
    // value so this isn't called on every render.
  }, [input]);
}
