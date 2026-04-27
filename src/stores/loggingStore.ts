import { create } from 'zustand';

export type QuickLogKind = 'feed' | 'sleep' | 'diaper' | 'bath';

interface ActiveTimer {
  kind: QuickLogKind;
  startedAt: Date;
}

interface LoggingState {
  activeTimer: ActiveTimer | null;
  startTimer: (kind: QuickLogKind) => void;
  stopTimer: () => void;
}

/**
 * Tracks the currently in-progress quick-log action (feeding, sleep, etc).
 *
 * Only ONE timer can be active at a time — starting a new one while another
 * is in progress simply overwrites it. Caller is responsible for asking the
 * user "끝낼까요?" before discarding an in-progress timer.
 *
 * Persistence (AsyncStorage) and Supabase write-through are deferred to T501.
 */
export const useLoggingStore = create<LoggingState>((set) => ({
  activeTimer: null,
  startTimer: (kind) =>
    set({
      activeTimer: { kind, startedAt: new Date() },
    }),
  stopTimer: () => set({ activeTimer: null }),
}));
