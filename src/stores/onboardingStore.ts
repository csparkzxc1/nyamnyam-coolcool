import { create } from 'zustand';

import type { FeedingType, Gender } from '@/features/babies/api';

/**
 * Last-feed presets the user picks on Step 3. They drive whether we
 * back-date a synthetic feeding record after the baby is created
 * (so the home screen has data to predict against from minute 0).
 */
export type LastFeedChoice = 'just-now' | '30m-ago' | '1h-ago' | 'unknown';

/** Picker shown on Step 4 — maps 1:1 to NotificationTone in settings. */
export type OnboardingTone = 'chime' | 'silent' | 'vibrate';

interface OnboardingState {
  // ----- Step 2: baby info -----
  name: string;
  birthDate: Date | null;
  gender: Gender | null;
  weightKg: string;

  // ----- Step 3: feeding -----
  feedingType: FeedingType;
  lastFeedChoice: LastFeedChoice | null;

  // ----- Step 4: notifications -----
  notificationsEnabled: boolean;
  tone: OnboardingTone;

  // ----- Step 5: sharing -----
  /** True once the user makes ANY choice on Step 5 (share/copy/skip). */
  step5AcknowledgedAt: number | null;

  setBabyInfo: (input: Partial<Pick<OnboardingState, 'name' | 'birthDate' | 'gender' | 'weightKg'>>) => void;
  setFeedingType: (t: FeedingType) => void;
  setLastFeedChoice: (c: LastFeedChoice) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setTone: (t: OnboardingTone) => void;
  acknowledgeStep5: () => void;
  reset: () => void;
}

const INITIAL: Omit<
  OnboardingState,
  | 'setBabyInfo'
  | 'setFeedingType'
  | 'setLastFeedChoice'
  | 'setNotificationsEnabled'
  | 'setTone'
  | 'acknowledgeStep5'
  | 'reset'
> = {
  name: '',
  birthDate: null,
  gender: null,
  weightKg: '',
  feedingType: 'mixed',
  lastFeedChoice: null,
  notificationsEnabled: true,
  tone: 'chime',
  step5AcknowledgedAt: null,
};

/**
 * Cross-step form state for the onboarding wizard.
 *
 * Intentionally NOT persisted to AsyncStorage — onboarding is a
 * single-session flow and persisting half-filled forms across app
 * restarts has more downsides (stale data) than upsides.
 *
 * Cleared on `reset()` after successful baby creation so a second
 * baby starts the wizard from a clean slate.
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL,
  setBabyInfo: (input) => set(input),
  setFeedingType: (feedingType) => set({ feedingType }),
  setLastFeedChoice: (lastFeedChoice) => set({ lastFeedChoice }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setTone: (tone) => set({ tone }),
  acknowledgeStep5: () => set({ step5AcknowledgedAt: Date.now() }),
  reset: () => set({ ...INITIAL }),
}));

/**
 * Returns the validation gate for Step 2 — the wizard's "next" button
 * is disabled until this passes. Mirrors the zod rules in the old
 * single-screen form, kept here so each step can render its own error.
 */
export function isStep2Valid(state: Pick<OnboardingState, 'name' | 'birthDate' | 'gender'>): boolean {
  if (state.name.trim().length === 0) return false;
  if (!state.birthDate) return false;
  if (state.birthDate > new Date()) return false;
  if (state.gender === null) return false;
  return true;
}

/** Map a Step-3 choice to the synthetic feed timestamp (or null when unknown). */
export function lastFeedAtFromChoice(
  choice: LastFeedChoice | null,
  now: Date,
): Date | null {
  switch (choice) {
    case 'just-now':
      return new Date(now);
    case '30m-ago':
      return new Date(now.getTime() - 30 * 60_000);
    case '1h-ago':
      return new Date(now.getTime() - 60 * 60_000);
    case 'unknown':
    case null:
      return null;
  }
}
