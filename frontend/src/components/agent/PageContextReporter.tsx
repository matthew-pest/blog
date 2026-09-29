'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CATEGORY_HUE, useAgentStore, type PageContext } from '@/lib/agent-state';

/** Tells the agent (and the field) where the visitor is and what they've selected. */
export default function PageContextReporter() {
  const pathname = usePathname() ?? '/';
  const setPage = useAgentStore((s) => s.setPage);
  const setHue = useAgentStore((s) => s.setHue);
  const setHighlight = useAgentStore((s) => s.setHighlight);

  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean); // [lang, ...]
    const rest = parts.slice(1);
    let ctx: Partial<PageContext> = { path: pathname, kind: 'other', postSlug: undefined, category: undefined, selection: undefined };
    if (rest.length === 0) ctx.kind = 'home';
    else if (rest[0] === 'blog' && rest.length === 1) ctx.kind = 'blog-index';
    else if (rest[0] === 'blog' && rest.length === 2) ctx = { ...ctx, kind: 'blog-index', category: rest[1] };
    else if (rest[0] === 'blog' && rest.length >= 3) ctx = { ...ctx, kind: 'post', category: rest[1], postSlug: rest[2] };
    else if (rest[0] === 'resume') ctx.kind = 'resume';
    else ctx.kind = 'page';

    // Publish the route immediately, then fill the title in once Next has set
    // it (on client navigations that lands a little after the route change).
    const withTitle = () => {
      const title = document.title.replace(/\s·\sMatt Pest$/, '');
      setPage({ ...ctx, title, postTitle: ctx.kind === 'post' ? title : undefined });
    };
    withTitle();
    const titleEl = document.querySelector('title');
    const observer = titleEl ? new MutationObserver(withTitle) : null;
    observer?.observe(titleEl!, { childList: true, characterData: true, subtree: true });
    const t = window.setTimeout(withTitle, 400);

    const hue =
      ctx.kind === 'post' || (ctx.kind === 'blog-index' && ctx.category)
        ? (CATEGORY_HUE[ctx.category ?? ''] ?? CATEGORY_HUE.default)
        : ctx.kind === 'resume'
          ? CATEGORY_HUE.resume
          : CATEGORY_HUE.default;
    setHue(hue);
    setHighlight(null);
    if (typeof CSS !== 'undefined' && 'highlights' in CSS) (CSS as any).highlights.delete('agent-highlight');

    return () => {
      window.clearTimeout(t);
      observer?.disconnect();
    };
  }, [pathname, setPage, setHue, setHighlight]);

  useEffect(() => {
    let timer: number | undefined;
    const onSelection = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const sel = document.getSelection()?.toString().trim() ?? '';
        if (document.activeElement?.closest('[data-agent-dock]')) return;
        setPage({ selection: sel.length > 12 ? sel.slice(0, 1200) : undefined });
      }, 250);
    };
    document.addEventListener('selectionchange', onSelection);
    return () => {
      document.removeEventListener('selectionchange', onSelection);
      window.clearTimeout(timer);
    };
  }, [setPage]);

  return null;
}
