import type { Metadata } from 'next';
import Link from 'next/link';
import { listPosts } from '@/lib/site/content';
import PostGrid from '@/components/site/PostGrid';

export const revalidate = 300;

type Params = Promise<{ lang: string; category: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  return { title: `${category[0]?.toUpperCase()}${category.slice(1)} posts` };
}

export default async function CategoryRoute({ params }: { params: Params }) {
  const { lang, category } = await params;
  const all = await listPosts();
  const posts = all.filter((p) => p.category === category);
  const categories = Array.from(new Map(all.map((p) => [p.category, p.categoryName])).entries());
  const name = posts[0]?.categoryName ?? category;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20">
      <header className="pt-10">
        <p className="eyebrow rise">Blog · {posts.length} posts</p>
        <h1 className="display rise rise-1 mt-4 text-5xl sm:text-6xl">{name}</h1>
        <div className="rise rise-2 mt-6 flex flex-wrap items-center gap-2">
          <Link href={`/${lang}/blog`} className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-glow/50">
            All
          </Link>
          {categories.map(([slug, label]) => (
            <Link
              key={slug}
              href={`/${lang}/blog/${slug}`}
              className={
                slug === category
                  ? 'rounded-full bg-accent px-3 py-1.5 text-xs'
                  : 'rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-glow/50'
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </header>
      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No posts in this category yet.</p>
      ) : (
        <PostGrid posts={posts} className="mt-10" />
      )}
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
