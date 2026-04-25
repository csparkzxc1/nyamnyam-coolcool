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
 * - babies / caregivers are created atomically via the `create_baby_with_caregiver` RPC.
 *   The RPC is SECURITY DEFINER and performs both inserts in one transaction, so the
 *   caregiver row exists before any follow-up SELECT — eliminating the race condition
 *   that previously caused 42501 errors or silent empty fetches on a user's first baby.
 * - babies SELECT is filtered by RLS to only babies where the current user is a caregiver.
 */

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// ============================================================
// Types
// ============================================================

type BabyRow = Database['public']['Tables']['babies']['Row'];

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
 * Delegates to the `create_baby_with_caregiver` DB function, which atomically
 * inserts a baby row and a matching caregiver row (role='parent') in the same
 * transaction. This is required because babies SELECT RLS is caregiver-based —
 * doing the two inserts separately (or via an AFTER INSERT trigger) creates a
 * race where the caregiver row is not yet visible when the baby row is read back.
 *
 * @throws When not authenticated, or on RLS / validation errors.
 */
export async function createBaby(input: CreateBabyInput): Promise<Baby> {
  const { data, error } = await supabase.rpc('create_baby_with_caregiver', {
    p_name: input.name.trim(),
    p_birth_date: input.birthDate,
    p_gender: genderToDb(input.gender),
    p_feeding_type: input.feedingType,
    p_weight_kg: input.weightKg ?? null,
  });

  if (error) throw error;
  if (!data) {
    throw new Error('create_baby_with_caregiver returned no data');
  }
  // The function returns a single row (public.babies). supabase-js types it
  // based on generated Database types; cast to Baby for the caller.
  return data as unknown as Baby;
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
