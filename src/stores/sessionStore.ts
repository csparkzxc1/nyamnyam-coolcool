import { create } from 'zustand';

import type { Session } from '@supabase/supabase-js';

interface SessionState {
  session: Session | null;
  currentBabyId: string | null;
  setSession: (s: Session | null) => void;
  setCurrentBabyId: (id: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  currentBabyId: null,
  setSession: (session) => set({ session }),
  setCurrentBabyId: (currentBabyId) => set({ currentBabyId }),
}));
