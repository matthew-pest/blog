'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Shared slide building blocks. Children of a slide inherit the deck's
 * enter/center/exit variants, so anything given `variants={item}` staggers in
 * when the slide lands.
 */

export const stagger: Variants = {
  center: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

export const item: Variants = {
  enter: { opacity: 0, y: 18, filter: 'blur(4px)' },
  center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};

export function Stagger({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <motion.div variants={stagger} className={className} style={style}>
      {children}
    </motion.div>
  );
}

export function Item({ className, children, as = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'li' | 'p' | 'h1' | 'h2' | 'h3' }) {
  const Comp = motion[as];
  return (
    <Comp variants={item} className={className}>
      {children}
    </Comp>
  );
}

export function SlideHeader({ kicker, title, lede, className }: { kicker: string; title: ReactNode; lede?: ReactNode; className?: string }) {
  return (
    <Stagger className={cn('flex flex-col gap-[0.6em]', className)}>
      <Item as="p" className="eyebrow deck-small">
        {kicker}
      </Item>
      <Item as="h2" className="display deck-h2">
        {title}
      </Item>
      {lede && (
        <Item as="p" className="deck-lede max-w-[60ch] text-muted-foreground">
          {lede}
        </Item>
      )}
    </Stagger>
  );
}

export function Card({ className, children, accent, style }: { className?: string; children: ReactNode; accent?: boolean; style?: CSSProperties }) {
  return (
    <motion.div
      variants={item}
      style={style}
      className={cn('rounded-2xl border bg-background/35 p-[1.1em] backdrop-blur-sm', accent ? 'border-glow/40' : 'border-border/70', className)}
    >
      {children}
    </motion.div>
  );
}

export function Pill({ children, className, tone = 'muted' }: { children: ReactNode; className?: string; tone?: 'muted' | 'glow' | 'glow-2' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-[0.8em] py-[0.3em] deck-small whitespace-nowrap',
        tone === 'glow' && 'border-glow/40 bg-glow/10 text-foreground',
        tone === 'glow-2' && 'border-glow-2/40 bg-glow-2/10 text-foreground',
        tone === 'muted' && 'border-border text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ value, label, sub, className }: { value: ReactNode; label: string; sub?: string; className?: string }) {
  return (
    <motion.div variants={item} className={cn('flex flex-col', className)}>
      <span className="display deck-h1 text-glow">{value}</span>
      <span className="mt-[0.3em] deck-body font-medium">{label}</span>
      {sub && <span className="deck-small text-muted-foreground">{sub}</span>}
    </motion.div>
  );
}
