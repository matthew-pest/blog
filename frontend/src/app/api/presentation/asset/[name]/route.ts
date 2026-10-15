import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { PRESENTATION_COOKIE, verifyToken } from '@/lib/presentation/auth';

/**
 * Screenshots used in the deck. They live outside /public on purpose: a real
 * Slack thread and LangSmith charts should not be fetchable by anyone who
 * guesses a URL. Same cookie as the deck itself; 404 otherwise.
 */
const ASSETS: Record<string, string> = {
  'slack-thread.png': 'image/png',
  'trace-latency.png': 'image/png',
  'llm-latency.png': 'image/png',
};

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const type = ASSETS[name];
  if (!type) return new Response('Not found', { status: 404 });

  const jar = await cookies();
  if (!(await verifyToken(jar.get(PRESENTATION_COOKIE)?.value))) return new Response('Not found', { status: 404 });

  try {
    const file = await readFile(path.join(process.cwd(), 'private', 'deck', name));
    return new Response(new Uint8Array(file), {
      headers: { 'content-type': type, 'cache-control': 'private, max-age=3600', 'x-robots-tag': 'noindex' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
