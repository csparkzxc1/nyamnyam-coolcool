import { useQuery } from '@tanstack/react-query';

import { getBaby, type Baby } from '@/features/logging/api';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Returns the currently selected baby's full profile.
 *
 * Reads `currentBabyId` from the session store (set by app/index.tsx
 * when babies are loaded) and fetches the row from Supabase.
 *
 * Returns `null` data when no baby is selected — caller should guard
 * with `if (!query.data) return ...`.
 */
export function useCurrentBaby() {
  const babyId = useSessionStore((s) => s.currentBabyId);
  return useQuery<Baby | null>({
    queryKey: ['baby', babyId],
    queryFn: () => (babyId ? getBaby(babyId) : Promise.resolve(null)),
    enabled: !!babyId,
  });
}
