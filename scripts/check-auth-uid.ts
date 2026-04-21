/**
 * Check what auth.uid() returns from inside the database,
 * when called via an authenticated Supabase client.
 *
 * Prereq: debug_auth_uid() function exists in DB.
 * (Created during T103b debugging; drop when no longer needed.)
 */

/* eslint-disable no-console */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_USER_A_EMAIL;
const PASSWORD = process.env.TEST_USER_A_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !EMAIL || !PASSWORD) {
  console.error('Missing required env vars.');
  process.exit(1);
}

const url: string = SUPABASE_URL;
const anonKey: string = SUPABASE_ANON_KEY;
const email: string = EMAIL;
const password: string = PASSWORD;

async function main() {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    console.error('Sign in failed:', signInErr.message);
    process.exit(1);
  }

  console.log('Client says user id:', signInData.user?.id);

  const { data, error } = await client.rpc('debug_auth_uid');

  if (error) {
    console.error('RPC error:', error.message);
    console.error('  code:', error.code);
    console.error('  details:', error.details);
    console.error('  hint:', error.hint);
    process.exit(1);
  }

  console.log('\n--- What the database sees ---');
  console.log(JSON.stringify(data, null, 2));

  process.exit(0);
}

main();
