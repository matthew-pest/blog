import type { Metadata } from 'next';
import Link from 'next/link';
import { listPosts } from '@/lib/site/content';
import PostGrid from '@/components/site/PostGrid';
import AskButton from '@/components/site/AskButton';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Essays on physics, AI, engineering and sound.',
};

export default async function BlogIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const posts = await listPosts();
  const categories = Array.from(new Map(posts.map((p) => [p.category, p.categoryName])).entries());

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20">
      <header className="pt-10">
        <p className="eyebrow rise">Blog · {posts.length} posts</p>
        <h1 className="display rise rise-1 mt-4 text-5xl sm:text-6xl">Things I find cool.</h1>
        <div className="rise rise-2 mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-3 py-1.5 text-xs">All</span>
          {categories.map(([slug, name]) => (
            <Link key={slug} href={`/${lang}/blog/${slug}`} className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-glow/50">
              {name}
            </Link>
          ))}
          <AskButton variant="ghost" className="ml-auto px-4 py-1.5 text-xs" prompt="Which post should I read first, and why?">
            Ask for a recommendation
          </AskButton>
        </div>
      </header>
      <PostGrid posts={posts} className="mt-10" />
    </div>
  );
}
