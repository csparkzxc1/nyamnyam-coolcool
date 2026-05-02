import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  DndWindow,
  ScheduleSettings,
} from '@/features/notifications/scheduler';
import { DEFAULT_SETTINGS } from '@/features/notifications/scheduler';
import type { PermissionStatus } from '@/lib/notifications';

export type NotificationTone = 'chime' | 'silent' | 'vibrate';

interface NotificationSettingsState extends ScheduleSettings {
  tone: NotificationTone;
  permission: PermissionStatus;
  setEnabled: (enabled: boolean) => void;
  setFeedReminders: (on: boolean) => void;
  setSleepReminders: (on: boolean) => void;
  setDnd: (dnd: DndWindow) => void;
  setTone: (tone: NotificationTone) => void;
  setPermission: (status: PermissionStatus) => void;
  reset: () => void;
}

/**
 * Local-first settings store. The values mirror the form on the
 * settings tab. Persisted to AsyncStorage so toggles survive app
 * restarts; permission state is intentionally NOT persisted — it
 * always reflects the live OS permission probed at startup.
 */
export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      tone: 'chime',
      permission: 'undetermined',
      setEnabled: (enabled) => set({ enabled }),
      setFeedReminders: (feedRemindersEnabled) => set({ feedRemindersEnabled }),
      setSleepReminders: (sleepRemindersEnabled) => set({ sleepRemindersEnabled }),
      setDnd: (dnd) => set({ dnd }),
      setTone: (tone) => set({ tone }),
      setPermission: (permission) => set({ permission }),
      reset: () =>
        set({
          ...DEFAULT_SETTINGS,
          tone: 'chime',
          permission: 'undetermined',
        }),
    }),
    {
      name: 'nyamnyam:notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        feedRemindersEnabled: state.feedRemindersEnabled,
        sleepRemindersEnabled: state.sleepRemindersEnabled,
        dnd: state.dnd,
        tone: state.tone,
      }),
    },
  ),
);
