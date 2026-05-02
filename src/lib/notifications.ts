/**
 * Cross-cutting helpers for expo-notifications setup. Called once at app
 * boot (root layout) and exposes the imperative permission + channel
 * primitives that the settings screen and the scheduler call.
 *
 * Native effects only run inside expo-notifications. Tests should not
 * touch this file — they import the in-memory scheduler from
 * `src/features/notifications/inMemoryScheduler.ts`.
 */
import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Configure the foreground presentation policy + Android channels.
 * Idempotent — safe to call on every app start.
 */
export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('normal', {
      name: '일반 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('warning', {
      name: '주의 알림',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('critical', {
      name: '안전 경고',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      bypassDnd: true,
    });
  }
}

/**
 * Asks the OS for permission. Returns the resulting status.
 * Calling this on iOS more than once is a no-op after the first decision —
 * the user must change permission via Settings.app from there on.
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return 'granted';
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return next.status as PermissionStatus;
}

/** Read-only permission probe; never triggers a prompt. */
export async function getNotificationPermission(): Promise<PermissionStatus> {
  const r = await Notifications.getPermissionsAsync();
  return r.status as PermissionStatus;
}
