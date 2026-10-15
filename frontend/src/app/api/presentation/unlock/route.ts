import { cookies } from 'next/headers';
import { checkPassword, cookieOptions, issueToken, verifyToken } from '@/lib/presentation/auth';
import { checkRateLimit, clientIp } from '@/lib/ai/rate-limit';

/**
 * Unlocks the hidden presentation. The agent's client tool posts the password
 * the visitor typed; on an exact match the browser gets an httpOnly cookie
 * that the presentation page and the chat route verify.
 */
export async function POST(req: Request) {
  const limit = checkRateLimit(`unlock:${clientIp(req)}`);
  if (!limit.ok) return Response.json({ ok: false, reason: 'Too many attempts. Try again later.' }, { status: 429 });

  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* fallthrough */
  }

  if (!checkPassword(body.password)) {
    return Response.json({ ok: false, reason: 'Wrong password.' }, { status: 401 });
  }

  const jar = await cookies();
  jar.set({ ...cookieOptions(), value: await issueToken() });
  return Response.json({ ok: true });
}

/** Lets the client ask whether this browser is already unlocked. */
export async function GET() {
  const jar = await cookies();
  const ok = await verifyToken(jar.get(cookieOptions().name)?.value);
  return Response.json({ unlocked: ok });
}
