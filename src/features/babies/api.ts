/**
 * Babies feature API wrappers
 *
 * Domain API layer for baby profile operations.
 * Components should NEVER call supabase.from('babies') directly — always use these wrappers.
 *
 * Covered: create baby, list babies for current user.
 *
 * Error strategy: all functions throw on error (consistent with auth/api.ts, logging/api.ts).
 * Callers use try/catch or React Query .catch().
 *
 * RLS notes:
 * - babies INSERT requires `created_by = auth.uid()` (handled by supabase.auth context).
 * - After INSERT, a DB trigger (`auto_register_caregiver`) automatically creates a
 *   caregiver row with role='parent'. Client does NOT need to insert caregivers manually.
 * - babies SELECT is filtered to only babies where the current user is a caregiver.
 */

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// ============================================================
// Types
// ============================================================

type BabyRow = Database['public']['Tables']['babies']['Row'];
type BabyInsert = Database['public']['Tables']['babies']['Insert'];

/**
 * App-level gender values. Mapped to DB 'M'/'F'.
 */
export type Gender = 'male' | 'female';

/**
 * App-level feeding type values. Matches DB values 1:1 for simplicity.
 */
export type FeedingType = 'breast' | 'formula' | 'mixed';

/**
 * Input for creating a new baby profile.
 *
 * Fields that the server fills in (id, created_by, created_at, updated_at)
 * are intentionally omitted here.
 */
export interface CreateBabyInput {
  /** Display name or nickname (태명). */
  name: string;
  /** Birth date in 'YYYY-MM-DD' format. */
  birthDate: string;
  /** Required at app level (the DB allows null for legacy reasons). */
  gender: Gender;
  /** Primary feeding method. Used as default in feeding records. */
  feedingType: FeedingType;
  /** Birth weight in kg. Optional. */
  weightKg?: number | null;
}

/**
 * A baby profile as returned from the database.
 */
export type Baby = BabyRow;

// ============================================================
// Internal: app <-> DB value mapping
// ============================================================

function genderToDb(gender: Gender): 'M' | 'F' {
  return gender === 'male' ? 'M' : 'F';
}

// ============================================================
// Create
// ============================================================

/**
 * Create a new baby profile for the currently authenticated user.
 *
 * The current user is automatically registered as the parent caregiver
 * by a DB trigger (`auto_register_caregiver`). No extra client work needed.
 *
 * @throws When not authenticated, or on RLS / validation errors.
 */
export async function createBaby(input: CreateBabyInput): Promise<Baby> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const payload: BabyInsert = {
    name: input.name.trim(),
    birth_date: input.birthDate,
    gender: genderToDb(input.gender),
    feeding_type: input.feedingType,
    weight_kg: input.weightKg ?? null,
    created_by: user.id,
  };

  const { data, error } = await supabase.from('babies').insert(payload).select().single();

  if (error) throw error;
  return data;
}

// ============================================================
// Read
// ============================================================

/**
 * List all babies that the current user is a caregiver of.
 *
 * RLS filters the result automatically — this query only returns babies
 * the user has access to. Returns empty array when the user has no babies yet.
 *
 * Ordered by creation time ascending (oldest first) so the first-added
 * baby stays as the default when there are multiple.
 *
 * @throws On network error or unexpected RLS failure.
 */
export async function getBabiesForCurrentUser(): Promise<Baby[]> {
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
