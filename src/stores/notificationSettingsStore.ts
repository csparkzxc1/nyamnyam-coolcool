import { create } from 'zustand';

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
 * settings tab; persistence to Supabase happens in T604 (deferred — for
 * the MVP "settings reset on reinstall" is acceptable).
 */
export const useNotificationSettingsStore = create<NotificationSettingsState>((set) => ({
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
}));
