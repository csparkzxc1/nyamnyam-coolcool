import { create } from 'zustand';

export type QuickLogKind = 'feed' | 'sleep' | 'diaper' | 'bath';

interface ActiveTimer {
  kind: QuickLogKind;
  startedAt: Date;
  /**
   * The DB record id of the in-flight record. Null while the create
   * mutation is still pending (optimistic UI), filled in by attachRecordId
   * once the server responds. Required when stopTimer fires the
   * matching update mutation.
   */
  recordId: string | null;
}

interface LoggingState {
  activeTimer: ActiveTimer | null;
  /**
   * Begin a timer optimistically. recordId starts null — the caller fires
   * the create mutation in parallel and calls attachRecordId on success.
   */
  startTimer: (kind: QuickLogKind) => void;
  /**
   * Persist the DB-issued record id onto the active timer.
   * No-op when there is no active timer or kind doesn't match —
   * protects against late responses arriving after the user already
   * stopped or restarted the timer.
   */
  attachRecordId: (kind: QuickLogKind, recordId: string) => void;
  /**
   * Clear the active timer. The caller is responsible for firing the
   * matching update (end_at) mutation before calling this.
   */
  stopTimer: () => void;
}

/**
 * Tracks the currently in-progress quick-log action (feeding, sleep, etc).
 *
 * Only ONE timer can be active at a time — starting a new one while another
 * is in progress simply overwrites it. Caller is responsible for asking the
 * user "끝낼까요?" before discarding an in-progress timer.
 *
 * Persistence (AsyncStorage) is deferred to a later sprint. Supabase
 * write-through happens in the home screen via TanStack Query mutations.
 */
export const useLoggingStore = create<LoggingState>((set) => ({
  activeTimer: null,
  startTimer: (kind) =>
    set({
      activeTimer: { kind, startedAt: new Date(), recordId: null },
    }),
  attachRecordId: (kind, recordId) =>
    set((state) => {
      // Guard: only attach if timer is still active for this same kind.
      // Protects against stale responses from a cancelled/restarted timer.
      if (!state.activeTimer || state.activeTimer.kind !== kind) {
        return state;
      }
      return {
        activeTimer: { ...state.activeTimer, recordId },
      };
    }),
  stopTimer: () => set({ activeTimer: null }),
}));
