/**
 * Auth feature API wrappers
 *
 * Domain API layer for authentication operations.
 * Components should NEVER call supabase.auth directly — always use these wrappers.
 *
 * Covered: sign up, sign in, sign out, get session/user, auth state subscription.
 *
 * Error strategy: all functions throw on error (consistent with logging/api.ts).
 * Callers use try/catch or React Query .catch().
 *
 * NOTE: This module intentionally does NOT connect to the Zustand session store.
 * That wiring happens in T105 via `supabase.auth.onAuthStateChange` in app/_layout.tsx,
 * using the `subscribeToAuthChanges` helper below.
 */

import { supabase } from '@/lib/supabase';

import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// ============================================================
// Input types
// ============================================================

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export interface SignUpResult {
  /**
   * User object if sign-up succeeded.
   * May be non-null even when session is null (e.g. email confirmation required).
   */
  user: User | null;
  /**
   * Session object if the project is configured to auto-confirm users
   * or if email confirmation is disabled. Null when confirmation is pending.
   */
  session: Session | null;
}

// ============================================================
// Sign up / sign in / sign out
// ============================================================

/**
 * Create a new account with email + password.
 *
 * Depending on Supabase project settings ("Confirm email" on/off),
 * `session` may be null after sign-up — the user must click the confirmation
 * email before a session is issued.
 *
 * @throws When the email is already registered, password is too weak, etc.
 */
export async function signUp(credentials: EmailPasswordCredentials): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) throw error;
  return { user: data.user, session: data.session };
}

/**
 * Sign in with email + password. Returns the new session on success.
 *
 * @throws On invalid credentials, unconfirmed email, rate limits, etc.
 */
export async function signIn(credentials: EmailPasswordCredentials): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data.session;
}

/**
 * Sign out the current user. Clears the session from AsyncStorage.
 *
 * Safe to call even when no session exists — Supabase returns gracefully.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============================================================
// Session & user getters
// ============================================================

/**
 * Read the current session from local storage (does not hit the network).
 * Returns null if the user is not signed in or the session has expired
 * beyond its refresh window.
 *
 * Use this for quick UI decisions like "show login screen vs home".
 * For up-to-date validated user data, prefer `getCurrentUser()`.
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Fetch the current user from the Supabase server.
 * This actually validates the JWT against the server, unlike `getSession`.
 *
 * Use this when you need to confirm the user is still valid
 * (e.g. after a sensitive action, on app resume).
 *
 * Returns null if the user is signed out.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // getUser() throws on "no session" as well — treat that as null, not error.
    if (error.message.toLowerCase().includes('session')) return null;
    throw error;
  }
  return data.user;
}

// ============================================================
// Auth state subscription
// ============================================================

/**
 * Subscribe to auth state changes (sign-in, sign-out, token refresh, etc).
 *
 * Intended to be called ONCE at app bootstrap (e.g. in `app/_layout.tsx`)
 * to keep the Zustand session store in sync with Supabase.
 *
 * @returns Unsubscribe function. Call it in a cleanup effect to detach
 *          the listener (prevents duplicate subscriptions during hot reload).
 *
 * @example
 *   useEffect(() => {
 *     const unsubscribe = subscribeToAuthChanges((event, session) => {
 *       useSessionStore.getState().setSession(session);
 *     });
 *     return unsubscribe;
 *   }, []);
 */
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}
