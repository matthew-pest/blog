'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/lib/agent-state';

export default function Nav({
  lang,
  logoUrl,
  logoText,
}: {
  lang: string;
  logoUrl: string | null;
  logoText: string;
}) {
  const path = usePathname();
  const toggleDock = useAgentStore((s) => s.toggleDock);
  const mood = useAgentStore((s) => s.mood);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: `/${lang}`, label: 'Home', exact: true },
    { href: `/${lang}/blog`, label: 'Blog' },
    { href: `/${lang}#projects`, label: 'Projects', exact: true },
    { href: `/${lang}/resume`, label: 'Résumé' },
  ];

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          'mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-3 transition-all duration-500 sm:px-4',
          scrolled ? 'glass' : 'border border-transparent'
        )}
      >
        <Link href={`/${lang}`} className="group flex items-center gap-2.5 pl-1">
          <span className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-primary">
            {logoUrl ? (
              // Animated GIF: next/image is unoptimized site-wide, so this stays animated.
              <Image src={logoUrl} alt="" width={64} height={64} unoptimized className="size-full object-cover" />
            ) : (
              <span className="text-[0.8rem] font-semibold text-primary-foreground">M</span>
            )}
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-background transition-colors',
                mood === 'idle' ? 'bg-muted-foreground/60' : 'bg-glow'
              )}
            />
          </span>
          <span className="text-sm font-medium tracking-tight">{logoText}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.exact ? path === l.href.replace(/#.*$/, '') : path?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href="https://github.com/matthew-pest"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="hidden size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground sm:grid"
          >
            <GithubMark className="size-4" />
          </a>
          <button
            type="button"
            onClick={toggleDock}
            className="group flex h-9 items-center gap-2 rounded-full border border-border bg-background/50 pl-3 pr-1.5 text-sm transition-colors hover:border-glow/50 hover:bg-accent"
          >
            <Sparkles className="size-3.5 text-glow" />
            <span>Ask</span>
            <span className="kbd hidden sm:inline">{isMac ? '⌘' : 'Ctrl'} K</span>
          </button>
        </div>
      </div>
    </header>
  );
}
