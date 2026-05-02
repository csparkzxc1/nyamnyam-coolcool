import { create } from 'zustand';

import type { AnomalyCode } from '@/features/anomalies/detect';

interface AnomaliesState {
  /** Map of anomaly code → ms timestamp at which it was dismissed. */
  dismissedAt: Partial<Record<AnomalyCode, number>>;
  dismiss: (code: AnomalyCode, at: Date) => void;
  /** Test-only escape hatch. */
  reset: () => void;
}

/**
 * In-memory dismiss state for anomaly banners. Critical anomalies
 * ignore dismiss state — see `isDismissed` consumer below — so they
 * always reappear even if the user tried to swipe them away.
 *
 * Persistence (AsyncStorage) is deferred until we see real product
 * usage; for the MVP "dismiss until app restart" is acceptable and
 * keeps the store free of platform-coupled storage.
 */
export const useAnomaliesStore = create<AnomaliesState>((set) => ({
  dismissedAt: {},
  dismiss: (code, at) =>
    set((state) => ({
      dismissedAt: { ...state.dismissedAt, [code]: at.getTime() },
    })),
  reset: () => set({ dismissedAt: {} }),
}));

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
