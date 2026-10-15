import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { PRESENTATION_COOKIE, verifyToken } from '@/lib/presentation/auth';
import { DECK } from '@/lib/deck/hogbot';
import Deck from '@/components/deck/Deck';

export const metadata: Metadata = {
  title: `${DECK.title} — ${DECK.event}`,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * The hidden deck. Not linked from anywhere; without the access cookie that
 * only /api/presentation/unlock sets, this is a 404 — indistinguishable from a
 * page that does not exist.
 */
export default async function AwsPresentationPage() {
  const jar = await cookies();
  const ok = await verifyToken(jar.get(PRESENTATION_COOKIE)?.value);
  if (!ok) notFound();

  return <Deck />;
}
