import Link from 'next/link';
import { listPosts } from '@/lib/site/content';
import AskButton from '@/components/site/AskButton';

export default async function PostLayout({
  params,
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string; slug: string; category: string }>;
}) {
  const { lang, slug, category } = await params;
  const posts = await listPosts().catch(() => []);
  const related = posts.filter((p) => p.category === category && p.slug !== slug).slice(0, 5);
  const categories = Array.from(new Map(posts.map((p) => [p.category, p.categoryName])).entries());

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">{children}</div>
        <aside className="no-print space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl p-5 glass">
            <p className="eyebrow">Ask about this post</p>
            <p className="mt-2 text-sm text-muted-foreground">Select any passage and ask — or let the agent highlight the parts that matter.</p>
            <AskButton variant="ghost" className="mt-4 w-full justify-center" prompt="Summarize this post and highlight its central claim.">
              Summarize &amp; highlight
            </AskButton>
          </div>
          {related.length > 0 && (
            <div className="rounded-3xl p-5 glass">
              <p className="eyebrow">More in {related[0].categoryName}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link href={p.path} className="text-foreground/90 hover:text-glow">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 px-1">
            {categories.map(([s, name]) => (
              <Link key={s} href={`/${lang}/blog/${s}`} className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-glow/50">
                {name}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
