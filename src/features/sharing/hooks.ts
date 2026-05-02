import { useEffect } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import {
  acceptInvite,
  createInvite,
  getInvite,
  listActiveInvites,
  listCaregivers,
  removeCaregiver,
  revokeInvite,
  type Caregiver,
  type Invite,
} from './api';

const invitesKey = (babyId: string | null) => ['invites', babyId] as const;
const caregiversKey = (babyId: string | null) => ['caregivers', babyId] as const;

export function useActiveInvites(babyId: string | null) {
  return useQuery<Invite[]>({
    queryKey: invitesKey(babyId),
    queryFn: () => (babyId ? listActiveInvites(babyId) : Promise.resolve([])),
    enabled: !!babyId,
  });
}

export function useCreateInvite(babyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createInvite>[0]) => createInvite(input),
    onSuccess: () => {
      if (babyId) queryClient.invalidateQueries({ queryKey: invitesKey(babyId) });
    },
  });
}

export function useRevokeInvite(babyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => revokeInvite(token),
    onSuccess: () => {
      if (babyId) queryClient.invalidateQueries({ queryKey: invitesKey(babyId) });
    },
  });
}

export function useCaregivers(babyId: string | null) {
  return useQuery<Caregiver[]>({
    queryKey: caregiversKey(babyId),
    queryFn: () => (babyId ? listCaregivers(babyId) : Promise.resolve([])),
    enabled: !!babyId,
  });
}

export function useRemoveCaregiver(babyId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (caregiverId: string) => removeCaregiver(caregiverId),
    onSuccess: () => {
      if (babyId) queryClient.invalidateQueries({ queryKey: caregiversKey(babyId) });
    },
  });
}

export function useInvite(token: string | null) {
  return useQuery<Invite | null>({
    queryKey: ['invite', token],
    queryFn: () => (token ? getInvite(token) : Promise.resolve(null)),
    enabled: !!token,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { token: string; userId: string }) => acceptInvite(input),
    onSuccess: (caregiver) => {
      // Bust the babies + caregivers cache so the new baby appears immediately.
      queryClient.invalidateQueries({ queryKey: ['babies'] });
      queryClient.invalidateQueries({ queryKey: caregiversKey(caregiver.baby_id) });
    },
  });
}

// ============================================================
// Realtime sync — T802
// ============================================================

/**
 * Subscribes to all 4 record tables for a single baby and invalidates
 * the matching React Query caches when a row changes. The remote
 * caregiver's edits land on this device within ~1 second.
 *
 * One channel per baby; the cleanup unsubscribes on unmount or when
 * the babyId changes. Subscribing to broader scopes (all babies, all
 * tables) would balloon Supabase realtime cost, so we filter to the
 * specific baby_id.
 */
export function useRealtimeBabySync(babyId: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!babyId) return;
    const channel = supabase
      .channel(`baby-${babyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feeding_records', filter: `baby_id=eq.${babyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events', babyId] });
          queryClient.invalidateQueries({ queryKey: ['eventsByDate', babyId] });
          queryClient.invalidateQueries({ queryKey: ['detailedEvents', babyId] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sleep_records', filter: `baby_id=eq.${babyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events', babyId] });
          queryClient.invalidateQueries({ queryKey: ['eventsByDate', babyId] });
          queryClient.invalidateQueries({ queryKey: ['detailedEvents', babyId] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'diaper_records', filter: `baby_id=eq.${babyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events', babyId] });
          queryClient.invalidateQueries({ queryKey: ['eventsByDate', babyId] });
          queryClient.invalidateQueries({ queryKey: ['detailedEvents', babyId] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bath_records', filter: `baby_id=eq.${babyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['events', babyId] });
          queryClient.invalidateQueries({ queryKey: ['eventsByDate', babyId] });
          queryClient.invalidateQueries({ queryKey: ['detailedEvents', babyId] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'caregivers', filter: `baby_id=eq.${babyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: caregiversKey(babyId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [babyId, queryClient]);
}
