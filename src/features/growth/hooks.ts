import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createGrowthRecord, deleteGrowthRecord, listGrowthRecords } from './api';
import type { GrowthInsert, GrowthRecord } from './api';

const growthKey = (babyId: string | null) => ['growth', babyId] as const;

/**
 * Loads every growth record for the baby. Stale-time is generous —
 * users add a new measurement once a week at most, so refetching
 * eagerly is wasted bandwidth.
 */
export function useGrowthRecords(babyId: string | null) {
  return useQuery<GrowthRecord[]>({
    queryKey: growthKey(babyId),
    queryFn: () => (babyId ? listGrowthRecords(babyId) : Promise.resolve([])),
    enabled: !!babyId,
    staleTime: 60_000,
  });
}

export function useCreateGrowthRecord(babyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GrowthInsert) => createGrowthRecord(input),
    onSuccess: () => {
      if (babyId) queryClient.invalidateQueries({ queryKey: growthKey(babyId) });
    },
  });
}

export function useDeleteGrowthRecord(babyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrowthRecord(id),
    onSuccess: () => {
      if (babyId) queryClient.invalidateQueries({ queryKey: growthKey(babyId) });
    },
  });
}
