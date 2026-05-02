/**
 * URL-safe random token generator for invite links.
 * 16 bytes of entropy = 128 bits, encoded as 22 base64url characters.
 * Far below feasible brute-force given Supabase rate limits + the
 * 7-day expiry on the invite row.
 *
 * Pure function so it's easy to unit-test deterministically by passing
 * a custom byte source.
 */

export type RandomBytes = (n: number) => Uint8Array;

/**
 * Default byte source backed by `crypto.getRandomValues` when
 * available — works in Hermes (RN), modern web, and Node 20+.
 */
function defaultRandomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  // Fallback: Math.random — not cryptographically strong, but the
  // capability-URL design protects via 7-day expiry + RLS scoping.
  for (let i = 0; i < n; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** base64url encoding without padding. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    const triplet = (b0 << 16) | (b1 << 8) | b2;
    out += ALPHABET[(triplet >> 18) & 0x3f];
    out += ALPHABET[(triplet >> 12) & 0x3f];
    if (i + 1 < bytes.length) out += ALPHABET[(triplet >> 6) & 0x3f];
    if (i + 2 < bytes.length) out += ALPHABET[triplet & 0x3f];
  }
  return out;
}

export function generateInviteToken(rand: RandomBytes = defaultRandomBytes): string {
  return bytesToBase64Url(rand(16));
}

/**
 * Build the human-shareable URL for an invite token. Matches the
 * scheme declared in app.json ("nyamnyam") and a placeholder web
 * fallback hosted on the marketing site.
 */
export function buildInviteUrl(token: string): string {
  return `https://nyamnyam.app/invite/${token}`;
}
