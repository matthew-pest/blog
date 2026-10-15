'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Path of a gated deck screenshot (served only with the presentation cookie). */
export function deckAsset(name: string) {
  return `/api/presentation/asset/${name}`;
}

/**
 * A screenshot in a slide: a framed thumbnail that opens full-size in a
 * lightbox. Keyboard events inside the lightbox don't reach the deck, so
 * arrows won't change slides while it is open.
 */
export default function Figure({
  src,
  alt,
  caption,
  className,
  imgClassName,
  children,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  className?: string;
  imgClassName?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  return (
    <>
      <figure className={cn('group relative flex min-h-0 flex-col gap-[0.5em]', className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Enlarge: ${alt}`}
          className="relative min-h-0 overflow-hidden rounded-xl border border-border/70 bg-ink/60 text-left transition-colors hover:border-glow/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className={cn('block h-auto w-full object-cover object-top', imgClassName)} draggable={false} />
          <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink/80 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-3.5" />
          </span>
        </button>
        {caption && <figcaption className="deck-small text-muted-foreground">{caption}</figcaption>}
        {children}
      </figure>

      <AnimatePresence>
        {open && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] grid place-items-center bg-ink/90 p-6 backdrop-blur-md"
          >
            <motion.img
              src={src}
              alt={alt}
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 4 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92dvh] max-w-[94vw] rounded-xl border border-border bg-ink object-contain shadow-2xl"
            />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-5 top-5 grid size-9 place-items-center rounded-full glass text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
            {caption && <p className="absolute bottom-5 left-1/2 max-w-[80vw] -translate-x-1/2 text-center text-xs text-muted-foreground">{caption}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
