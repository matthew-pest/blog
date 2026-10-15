/**
 * Access control for the hidden presentation section.
 *
 * The password is checked server-side only (the agent never sees it). A
 * successful check sets an httpOnly cookie carrying an HMAC the server can
 * verify without storing sessions. Works in Node route handlers and server
 * components via Web Crypto.
 */

export const PRESENTATION_COOKIE = 'mp_aws';
const COOKIE_MAX_AGE_SEC = 12 * 60 * 60;
const SCOPE = 'presentation:aws:v1';

function password(): string {
  return process.env.PRESENTATION_PASSWORD ?? 'AWS2026';
}

function secret(): string {
  return `${process.env.PRESENTATION_SECRET ?? process.env.AI_GATEWAY_API_KEY ?? 'dev-secret'}::${password()}`;
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Exact-match password check. */
export function checkPassword(candidate: unknown): boolean {
  return typeof candidate === 'string' && timingSafeEqual(candidate, password());
}

/** Token to store in the access cookie. */
export async function issueToken(): Promise<string> {
  return hmac(SCOPE);
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  return timingSafeEqual(token, await hmac(SCOPE));
}

/** Parse a raw Cookie header and verify the presentation token in it. */
export async function isUnlockedFromCookieHeader(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false;
  const m = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${PRESENTATION_COOKIE}=`));
  return verifyToken(m ? decodeURIComponent(m.slice(PRESENTATION_COOKIE.length + 1)) : null);
}

export function cookieOptions() {
  return {
    name: PRESENTATION_COOKIE,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}
