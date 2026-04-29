/**
 * Logging feature API wrappers
 *
 * Domain API layer for all "기록(logging)" operations.
 * Components should NEVER call supabase directly — always use these wrappers.
 *
 * Covered tables: babies, caregivers, feeding_records, sleep_records, diaper_records
 *
 * Error strategy: all functions throw on error. Callers use try/catch or
 * chain `.catch()` (React Query compatible).
 */

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// ============================================================
// Type aliases from generated Database types
// ============================================================

type Tables = Database['public']['Tables'];

export type Baby = Tables['babies']['Row'];
export type BabyInsert = Tables['babies']['Insert'];
export type BabyUpdate = Tables['babies']['Update'];

export type Caregiver = Tables['caregivers']['Row'];

export type FeedingRecord = Tables['feeding_records']['Row'];
export type FeedingInsert = Tables['feeding_records']['Insert'];
export type FeedingUpdate = Tables['feeding_records']['Update'];

export type SleepRecord = Tables['sleep_records']['Row'];
export type SleepInsert = Tables['sleep_records']['Insert'];
export type SleepUpdate = Tables['sleep_records']['Update'];

export type DiaperRecord = Tables['diaper_records']['Row'];
export type DiaperInsert = Tables['diaper_records']['Insert'];
export type BathRecord = Tables['bath_records']['Row'];
export type BathInsert = Tables['bath_records']['Insert'];

// ============================================================
// babies
// ============================================================

/**
 * Create a new baby. The auto_register_caregiver trigger will
 * automatically insert a `parent` caregiver row for the creator.
 *
 * @throws When RLS blocks the insert or input is invalid.
 */
export async function createBaby(input: BabyInsert): Promise<Baby> {
  const { data, error } = await supabase.from('babies').insert(input).select().single();
  if (error) throw error;
  return data;
}

/**
 * List all babies the current user is a caregiver of.
 * RLS policy `babies_select_caregivers` auto-filters by is_caregiver(id).
 */
export async function listMyBabies(): Promise<Baby[]> {
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch a single baby by id. Returns null if not found or not accessible.
 */
export async function getBaby(babyId: string): Promise<Baby | null> {
  const { data, error } = await supabase.from('babies').select('*').eq('id', babyId).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Update a baby. Only the creator can update (RLS `babies_update_creator`).
 * Fields like `id`, `created_by`, `created_at` should not be in `patch`.
 */
export async function updateBaby(babyId: string, patch: BabyUpdate): Promise<Baby> {
  const { data, error } = await supabase
    .from('babies')
    .update(patch)
    .eq('id', babyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a baby. Only the creator can delete. ON DELETE CASCADE removes
 * all related records (caregivers, feeding/sleep/diaper records).
 */
export async function deleteBaby(babyId: string): Promise<void> {
  const { error } = await supabase.from('babies').delete().eq('id', babyId);
  if (error) throw error;
}

// ============================================================
// caregivers
// ============================================================

/**
 * List caregivers of a baby (family members who share access).
 * RLS limits visibility to rows where the current user is also a caregiver.
 */
export async function listCaregivers(babyId: string): Promise<Caregiver[]> {
  const { data, error } = await supabase
    .from('caregivers')
    .select('*')
    .eq('baby_id', babyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * Remove a caregiver from a baby.
 * Only `parent` role caregivers can remove others (RLS `caregivers_delete_parent`).
 *
 * NOTE: Inviting new caregivers by email is not yet implemented —
 * it requires a server-side flow (edge function) to look up user_id.
 * For now caregivers are only created automatically via babies INSERT trigger.
 */
export async function removeCaregiver(caregiverId: string): Promise<void> {
  const { error } = await supabase.from('caregivers').delete().eq('id', caregiverId);
  if (error) throw error;
}

// ============================================================
// feeding_records
// ============================================================

/**
 * Create a feeding record. `end_at` can be null for an in-progress feeding;
 * update later via updateFeedingRecord to set it.
 */
export async function createFeedingRecord(input: FeedingInsert): Promise<FeedingRecord> {
  const { data, error } = await supabase.from('feeding_records').insert(input).select().single();
  if (error) throw error;
  return data;
}

/**
 * Update a feeding record (e.g. set end_at when feeding finishes,
 * correct amount_ml, add note).
 * Only the creator can update (RLS `feeding_records_update_creator`).
 */
export async function updateFeedingRecord(
  recordId: string,
  patch: FeedingUpdate,
): Promise<FeedingRecord> {
  const { data, error } = await supabase
    .from('feeding_records')
    .update(patch)
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a feeding record. Creator-only (RLS `feeding_records_delete_creator`).
 */
export async function deleteFeedingRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('feeding_records').delete().eq('id', recordId);
  if (error) throw error;
}

/**
 * List recent feedings for a baby, most recent first.
 * @param babyId
 * @param days  Look-back window in days. Default 7.
 */
export async function listRecentFeedings(babyId: string, days = 7): Promise<FeedingRecord[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('feeding_records')
    .select('*')
    .eq('baby_id', babyId)
    .gte('start_at', since)
    .order('start_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Get the currently in-progress feeding (end_at IS NULL) for a baby, if any.
 * Used by the UI to show "수유 중" state and resume feedings.
 */
export async function getActiveFeeding(babyId: string): Promise<FeedingRecord | null> {
  const { data, error } = await supabase
    .from('feeding_records')
    .select('*')
    .eq('baby_id', babyId)
    .is('end_at', null)
    .order('start_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================================
// sleep_records
// ============================================================

/**
 * Create a sleep record. `end_at` null = sleep in progress.
 */
export async function createSleepRecord(input: SleepInsert): Promise<SleepRecord> {
  const { data, error } = await supabase.from('sleep_records').insert(input).select().single();
  if (error) throw error;
  return data;
}

/**
 * Update a sleep record (typically to set end_at when baby wakes up,
 * or record sleep quality rating 1-5).
 */
export async function updateSleepRecord(
  recordId: string,
  patch: SleepUpdate,
): Promise<SleepRecord> {
  const { data, error } = await supabase
    .from('sleep_records')
    .update(patch)
    .eq('id', recordId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a sleep record. Creator-only.
 */
export async function deleteSleepRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('sleep_records').delete().eq('id', recordId);
  if (error) throw error;
}

/**
 * List recent sleeps for a baby, most recent first.
 */
export async function listRecentSleeps(babyId: string, days = 7): Promise<SleepRecord[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('sleep_records')
    .select('*')
    .eq('baby_id', babyId)
    .gte('start_at', since)
    .order('start_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Get the currently in-progress sleep (end_at IS NULL) for a baby.
 * Used by the UI to show "수면 중" state.
 */
export async function getActiveSleep(babyId: string): Promise<SleepRecord | null> {
  const { data, error } = await supabase
    .from('sleep_records')
    .select('*')
    .eq('baby_id', babyId)
    .is('end_at', null)
    .order('start_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================================
// diaper_records
// ============================================================

/**
 * Create a diaper change record. Unlike feeding/sleep, diaper events
 * are point-in-time (single `at` timestamp, no duration).
 */
export async function createDiaperRecord(input: DiaperInsert): Promise<DiaperRecord> {
  const { data, error } = await supabase.from('diaper_records').insert(input).select().single();
  if (error) throw error;
  return data;
}

/**
 * Delete a diaper record. Creator-only.
 * (Update intentionally omitted — diaper records are instantaneous and
 * typically recreated rather than edited.)
 */
export async function deleteDiaperRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('diaper_records').delete().eq('id', recordId);
  if (error) throw error;
}

/**
 * List recent diaper changes for a baby, most recent first.
 */
export async function listRecentDiapers(babyId: string, days = 7): Promise<DiaperRecord[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('diaper_records')
    .select('*')
    .eq('baby_id', babyId)
    .gte('at', since)
    .order('at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// bath_records
// ============================================================

/**
 * Create a bath record. Like diaper events, baths are point-in-time
 * (single `at` timestamp, no duration). `note` is optional free text.
 */
export async function createBathRecord(input: BathInsert): Promise<BathRecord> {
  const { data, error } = await supabase.from('bath_records').insert(input).select().single();
  if (error) throw error;
  return data;
}

/**
 * Delete a bath record. Creator-only (RLS `bath_records_delete_creator`).
 * (Update intentionally omitted — same pattern as diaper_records: bath
 * events are instantaneous and typically recreated rather than edited.)
 */
export async function deleteBathRecord(recordId: string): Promise<void> {
  const { error } = await supabase.from('bath_records').delete().eq('id', recordId);
  if (error) throw error;
}

/**
 * List recent bath records for a baby, most recent first.
 */
export async function listRecentBaths(babyId: string, days = 7): Promise<BathRecord[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('bath_records')
    .select('*')
    .eq('baby_id', babyId)
    .gte('at', since)
    .order('at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
