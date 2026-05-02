import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AnomalyCode } from '@/features/anomalies/detect';

interface AnomaliesState {
  /** Map of anomaly code → ms timestamp at which it was dismissed. */
  dismissedAt: Partial<Record<AnomalyCode, number>>;
  dismiss: (code: AnomalyCode, at: Date) => void;
  /** Test-only escape hatch. */
  reset: () => void;
}

/**
 * Dismiss state for anomaly banners. Critical anomalies bypass
 * dismiss filtering — see `isDismissedWithin24h` below — so they
 * always reappear even if the user tried to swipe them away.
 *
 * Persisted to AsyncStorage so a banner dismissed yesterday stays
 * hidden across app restarts.
 */
export const useAnomaliesStore = create<AnomaliesState>()(
  persist(
    (set) => ({
      dismissedAt: {},
      dismiss: (code, at) =>
        set((state) => ({
          dismissedAt: { ...state.dismissedAt, [code]: at.getTime() },
        })),
      reset: () => set({ dismissedAt: {} }),
    }),
    {
      name: 'nyamnyam:anomalies',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ dismissedAt: state.dismissedAt }),
    },
  ),
);

/**
 * True when a non-critical anomaly was dismissed within the last 24
 * hours. Critical anomalies (e.g. LOW_DIAPER_COUNT 4 or fewer) are
 * never considered dismissed — caregivers must see them.
 */
export function isDismissedWithin24h(
  dismissedAt: number | undefined,
  now: Date,
): boolean {
  if (!dismissedAt) return false;
  return now.getTime() - dismissedAt < 24 * 60 * 60_000;
}
