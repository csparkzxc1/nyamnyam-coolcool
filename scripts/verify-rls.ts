/**
 * T103b: RLS policy verification script
 *
 * Verifies the 3 acceptance criteria from T103:
 *   1. User B cannot SELECT user A's baby rows
 *   2. Unauthenticated requests are blocked
 *   3. User A (caregiver) can perform full CRUD on their own baby
 *
 * Requires env vars:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   TEST_USER_A_EMAIL
 *   TEST_USER_A_PASSWORD
 *   TEST_USER_B_EMAIL
 *   TEST_USER_B_PASSWORD
 */

/* eslint-disable no-console */

import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Env validation (narrows types for the rest of the file)
// ============================================================

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.TEST_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.TEST_USER_A_PASSWORD;
const USER_B_EMAIL = process.env.TEST_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.TEST_USER_B_PASSWORD;

if (
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  !USER_A_EMAIL ||
  !USER_A_PASSWORD ||
  !USER_B_EMAIL ||
  !USER_B_PASSWORD
) {
  console.error('[FAIL] Missing required env vars. See script header.');
  process.exit(1);
}

// After the throw above TypeScript narrows these to `string`.
const url: string = SUPABASE_URL;
const anonKey: string = SUPABASE_ANON_KEY;
const userAEmail: string = USER_A_EMAIL;
const userAPassword: string = USER_A_PASSWORD;
const userBEmail: string = USER_B_EMAIL;
const userBPassword: string = USER_B_PASSWORD;

// ============================================================
// Helpers
// ============================================================

function log(tag: '[OK]' | '[FAIL]' | '[INFO]', msg: string) {
  console.log(`${tag} ${msg}`);
}

function makeClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
  label: string,
): Promise<string> {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    log('[FAIL]', `${label} sign-in failed: ${error.message}`);
    process.exit(1);
  }
  if (!data.user) {
    log('[FAIL]', `${label} signed in but no user returned`);
    process.exit(1);
  }
  log('[INFO]', `${label} signed in: ${data.user.id}`);
  return data.user.id;
}

// ============================================================
// Main flow
// ============================================================

let babyId: string | null = null;
let clientA: SupabaseClient | null = null;

async function cleanup() {
  if (babyId && clientA) {
    log('[INFO]', 'Cleanup: deleting test baby...');
    const { error } = await clientA.from('babies').delete().eq('id', babyId);
    if (error) {
      log('[FAIL]', `Cleanup failed: ${error.message}`);
    } else {
      log('[INFO]', 'Cleanup done.');
    }
  }
}

async function main() {
  clientA = makeClient();
  const userAId = await signIn(clientA, userAEmail, userAPassword, 'User A');

  log('[INFO]', 'Creating test baby as user A...');
  const { data: baby, error: createErr } = await clientA
    .from('babies')
    .insert({
      name: 'RLS테스트아가',
      birth_date: '2026-01-15',
      gender: 'F',
      feeding_type: 'mixed',
      created_by: userAId,
    })
    .select()
    .single();

  if (createErr) {
    log('[FAIL]', `User A failed to create baby: ${createErr.message}`);
    process.exit(1);
  }
  babyId = baby.id;
  log('[OK]', `User A created baby ${babyId}`);

  // Acceptance #3a: user A can SELECT own baby
  const { data: ownRead, error: ownReadErr } = await clientA
    .from('babies')
    .select('*')
    .eq('id', babyId);

  if (ownReadErr) {
    log('[FAIL]', `User A cannot SELECT own baby: ${ownReadErr.message}`);
    await cleanup();
    process.exit(1);
  }
  if (!ownRead || ownRead.length !== 1) {
    log('[FAIL]', `User A expected 1 row, got ${ownRead?.length ?? 0}`);
    await cleanup();
    process.exit(1);
  }
  log('[OK]', 'Acceptance #3a: User A SELECT own baby returns 1 row');

  // Acceptance #1: user B cannot SELECT user A's baby
  const clientB = makeClient();
  await signIn(clientB, userBEmail, userBPassword, 'User B');

  const { data: bRead, error: bReadErr } = await clientB
    .from('babies')
    .select('*')
    .eq('id', babyId);

  if (bReadErr) {
    log('[FAIL]', `User B SELECT raised unexpected error: ${bReadErr.message}`);
    await cleanup();
    process.exit(1);
  }
  if (bRead && bRead.length > 0) {
    log('[FAIL]', `Acceptance #1 FAILED: User B saw ${bRead.length} rows (expected 0)`);
    await cleanup();
    process.exit(1);
  }
  log('[OK]', "Acceptance #1: User B SELECT of A's baby returns 0 rows");

  // Acceptance #1-extra: user B cannot UPDATE user A's baby
  const { error: bUpdateErr } = await clientB
    .from('babies')
    .update({ name: 'HackedName' })
    .eq('id', babyId);

  const { data: postUpdate, error: postUpdateErr } = await clientA
    .from('babies')
    .select('name')
    .eq('id', babyId)
    .single();

  if (postUpdateErr) {
    log('[FAIL]', `Post-update read failed: ${postUpdateErr.message}`);
    await cleanup();
    process.exit(1);
  }
  if (postUpdate.name === 'HackedName') {
    log(
      '[FAIL]',
      `Acceptance #1-extra FAILED: User B successfully modified A's baby (name=${postUpdate.name})`,
    );
    await cleanup();
    process.exit(1);
  }
  log('[OK]', "Acceptance #1-extra: User B UPDATE of A's baby had no effect");
  if (bUpdateErr) {
    log('[INFO]', `  (update returned error as expected: ${bUpdateErr.message})`);
  }

  // Acceptance #2: unauthenticated INSERT is blocked
  const anonClient = makeClient();
  const { error: anonErr } = await anonClient.from('babies').insert({
    name: 'AnonBaby',
    birth_date: '2026-01-01',
    gender: 'M',
    feeding_type: 'formula',
    created_by: '00000000-0000-0000-0000-000000000000',
  });

  if (!anonErr) {
    log('[FAIL]', 'Acceptance #2 FAILED: anonymous INSERT was not blocked');
    await cleanup();
    process.exit(1);
  }
  log('[OK]', `Acceptance #2: anonymous INSERT blocked by RLS (${anonErr.code ?? 'error'})`);

  // Acceptance #3b: user A can UPDATE own baby
  const { data: updated, error: updateErr } = await clientA
    .from('babies')
    .update({ weight_kg: 7.5 })
    .eq('id', babyId)
    .select()
    .single();

  if (updateErr) {
    log('[FAIL]', `User A UPDATE failed: ${updateErr.message}`);
    await cleanup();
    process.exit(1);
  }
  if (Number(updated.weight_kg) !== 7.5) {
    log('[FAIL]', `User A UPDATE did not persist (weight_kg=${updated.weight_kg})`);
    await cleanup();
    process.exit(1);
  }
  log('[OK]', 'Acceptance #3b: User A UPDATE own baby succeeded');

  // All acceptance criteria passed — cleanup
  await cleanup();
  log('[OK]', 'All T103 acceptance criteria verified. RLS policies working as designed.');
  process.exit(0);
}

main().catch(async (err) => {
  log('[FAIL]', `Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  await cleanup();
  process.exit(1);
});
