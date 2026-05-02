/**
 * Growth feature API wrappers — CRUD over growth_records.
 *
 * Mirrors the patterns of src/features/logging/api.ts: components never
 * call supabase directly; all errors throw and bubble through React
 * Query.
 */
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type Tables = Database['public']['Tables'];

export type GrowthRecord = Tables['growth_records']['Row'];
export type GrowthInsert = Tables['growth_records']['Insert'];
export type GrowthUpdate = Tables['growth_records']['Update'];

/**
 * Lists every growth record for a baby in chronological order.
 * The chart needs ascending time so points connect from oldest → newest.
 */
export async function listGrowthRecords(babyId: string): Promise<GrowthRecord[]> {
  const { data, error } = await supabase
    .from('growth_records')
    .select('*')
    .eq('baby_id', babyId)
    .order('measured_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGrowthRecord(input: GrowthInsert): Promise<GrowthRecord> {
  const { data, error } = await supabase
    .from('growth_records')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGrowthRecord(id: string): Promise<void> {
  const { error } = await supabase.from('growth_records').delete().eq('id', id);
  if (error) throw error;
}
