import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ============================================================
// Types
// ============================================================

/**
 * One completion record. We key by (babyId, doseId) so multiple
 * children share the same store without collision.
 */
export interface VaccineCompletion {
  babyId: string;
  doseId: string;
  /** ISO timestamp the parent marked the dose as done. */
  completedAt: string;
  /** Optional clinic name / memo the parent typed in. */
  note?: string;
}

interface VaccineState {
  /** Flat lookup keyed by `${babyId}:${doseId}` for O(1) access. */
  completions: Record<string, VaccineCompletion>;

  /** Mark a dose as completed. Idempotent — re-marking updates the
   *  timestamp, which is what parents actually want when they realise
   *  they entered the wrong date. */
  markCompleted: (babyId: string, doseId: string, completedAt: Date, note?: string) => void;

  /** Remove a completion. Used for "잘못 체크함" undo. */
  unmarkCompleted: (babyId: string, doseId: string) => void;

  /** Returns `{ doseId: completedDate }` for a single baby. Useful for
   *  feeding into vaccineSchedule helpers like nextDose(). */
  getCompletionsForBaby: (babyId: string) => Record<string, Date>;
}

// ============================================================
// Helpers
// ============================================================

const compositeKey = (babyId: string, doseId: string): string => `${babyId}:${doseId}`;

// ============================================================
// Store
// ============================================================

export const useVaccineStore = create<VaccineState>()(
  persist(
    (set, get) => ({
      completions: {},

      markCompleted: (babyId, doseId, completedAt, note) => {
        const key = compositeKey(babyId, doseId);
        set((state) => ({
          completions: {
            ...state.completions,
            [key]: {
              babyId,
              doseId,
              completedAt: completedAt.toISOString(),
              note,
            },
          },
        }));
      },

      unmarkCompleted: (babyId, doseId) => {
        const key = compositeKey(babyId, doseId);
        set((state) => {
          const next = { ...state.completions };
          delete next[key];
          return { completions: next };
        });
      },

      getCompletionsForBaby: (babyId) => {
        const result: Record<string, Date> = {};
        for (const c of Object.values(get().completions)) {
          if (c.babyId === babyId) {
            result[c.doseId] = new Date(c.completedAt);
          }
        }
        return result;
      },
    }),
    {
      name: 'nyamnyam-vaccines',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the data, not the actions.
      partialize: (state) => ({ completions: state.completions }),
    },
  ),
);
