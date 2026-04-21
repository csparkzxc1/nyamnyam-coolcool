/**
 * RLS diagnostic: inspect what the database sees when user A makes a request.
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

  if (!signInData.user || !signInData.session) {
    console.error('Sign in returned no user or session.');
    process.exit(1);
  }

  const userId = signInData.user.id;
  const accessToken = signInData.session.access_token;

  console.log('--- Client-side info ---');
  console.log('User ID from client:', userId);
  console.log('Session present:', true);
  console.log('Access token (first 40 chars):', accessToken.slice(0, 40));

  // Decode JWT payload
  const parts = accessToken.split('.');
  if (parts.length === 3) {
    const payloadB64 = parts[1];
    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString();
    const payload = JSON.parse(payloadJson);
    console.log('--- JWT payload ---');
    console.log('sub:', payload.sub);
    console.log('role:', payload.role);
    console.log('aud:', payload.aud);
    console.log('exp:', new Date(payload.exp * 1000).toISOString());
  }

  console.log('\n--- Server-side check via RPC-less SELECT ---');
  const { data: cg, error: cgErr } = await client
    .from('caregivers')
    .select('*')
    .eq('user_id', userId);

  if (cgErr) {
    console.log('caregivers select error:', cgErr.message);
  } else {
    console.log(
      'caregivers rows for self:',
      cg?.length ?? 0,
      '(expected 0 before any baby created)',
    );
  }

  console.log('\n--- Attempt babies INSERT ---');
  const { data: baby, error: babyErr } = await client
    .from('babies')
    .insert({
      name: 'Diag',
      birth_date: '2026-01-15',
      gender: 'F',
      feeding_type: 'mixed',
      created_by: userId,
    })
    .select();

  if (babyErr) {
    console.log('INSERT error:', babyErr.message);
    console.log('  code:', babyErr.code);
    console.log('  details:', babyErr.details);
    console.log('  hint:', babyErr.hint);
  } else {
    console.log('INSERT success! Rows:', baby);
    const createdId = baby?.[0]?.id;
    if (createdId) {
      await client.from('babies').delete().eq('id', createdId);
      console.log('Cleanup done.');
    }
  }

  process.exit(0);
}

main();
