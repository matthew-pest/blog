import Link from 'next/link';
import type { PostSummary } from '@/lib/site/content';
import { cn } from '@/lib/utils';

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PostGrid({ posts, className }: { posts: PostSummary[]; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {posts.map((p, i) => (
        <Link
          key={p.slug}
          href={p.path}
          className="group flex flex-col overflow-hidden rounded-3xl transition-all duration-500 glass hover:-translate-y-0.5 hover:border-glow/40 rise"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {p.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.coverUrl} alt="" className="aspect-[16/9] w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" loading="lazy" />
          ) : (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-glow/20 to-glow-2/10" />
          )}
          <div className="flex flex-1 flex-col p-5">
            <p className="eyebrow">
              {p.categoryName} · {formatDate(p.publishedAt)}
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight group-hover:text-glow">{p.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
