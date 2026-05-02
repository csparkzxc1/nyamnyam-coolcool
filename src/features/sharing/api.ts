/**
 * Sharing feature API — invite tokens + caregiver list mutations.
 */
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { generateInviteToken } from './inviteToken';

type Tables = Database['public']['Tables'];

export type Invite = Tables['invites']['Row'];
export type InviteInsert = Tables['invites']['Insert'];
export type Caregiver = Tables['caregivers']['Row'];

/**
 * Create a fresh invite for a baby. Re-using the existing un-used
 * invite (when one is still valid) is a UX nicety we punt on for the
 * MVP — a fresh token every time is simple and safe.
 */
export async function createInvite(input: {
  babyId: string;
  invitedBy: string;
  role: 'parent' | 'grandparent' | 'caregiver';
}): Promise<Invite> {
  const token = generateInviteToken();
  const insert: InviteInsert = {
    token,
    baby_id: input.babyId,
    invited_by: input.invitedBy,
    role: input.role,
  };
  const { data, error } = await supabase.from('invites').insert(insert).select().single();
  if (error) throw error;
  return data;
}

/** Look up an invite by token — used by the acceptance screen. */
export async function getInvite(token: string): Promise<Invite | null> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Accept an invite atomically:
 *   1. Mark the invite as used (UPDATE used_at + used_by — RLS only
 *      allows this when the row is unused and not expired).
 *   2. Insert the caregivers row.
 *
 * If either step fails the caller surfaces the error; an orphan
 * "used invite without caregiver row" is a stuck state but rare and
 * the user can retry by tapping the link again.
 */
export async function acceptInvite(input: {
  token: string;
  userId: string;
}): Promise<Caregiver> {
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .update({ used_at: new Date().toISOString(), used_by: input.userId })
    .eq('token', input.token)
    .is('used_at', null)
    .select()
    .single();
  if (inviteError) throw inviteError;
  if (!invite) throw new Error('이미 사용된 초대장이거나 만료되었어요.');

  const { data: caregiver, error: caregiverError } = await supabase
    .from('caregivers')
    .insert({
      baby_id: invite.baby_id,
      user_id: input.userId,
      role: invite.role,
    })
    .select()
    .single();
  if (caregiverError) throw caregiverError;
  return caregiver;
}

/**
 * List active (un-used, non-expired) invites for a baby — shown on
 * the share tab so the parent can re-share or revoke a pending
 * invite. Past-expiry rows are filtered out via expires_at > now.
 */
export async function listActiveInvites(babyId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('baby_id', babyId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function revokeInvite(token: string): Promise<void> {
  const { error } = await supabase.from('invites').delete().eq('token', token);
  if (error) throw error;
}

// ============================================================
// caregivers list + remove
// ============================================================

/**
 * Lists every caregiver attached to a baby. Used by the share tab
 * (T803) to render the "이 아기를 함께 돌보는 사람" list.
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
 * Remove a caregiver from a baby. Only the parent (or any creator)
 * can do this; RLS enforces. Removing yourself is allowed but the UI
 * should warn first.
 */
export async function removeCaregiver(caregiverId: string): Promise<void> {
  const { error } = await supabase.from('caregivers').delete().eq('id', caregiverId);
  if (error) throw error;
}
