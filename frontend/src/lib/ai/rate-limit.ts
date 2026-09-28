/**
 * Per-IP sliding-window rate limit. In-memory: good enough for a personal
 * site on Vercel (each warm function instance keeps its own window); the AI
 * Gateway budget is the real backstop.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 30;

const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'anonymous';
}

export function checkRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    hits.set(ip, recent);
    return { ok: false, retryAfterSec };
  }
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic GC so the map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return { ok: true };
}
