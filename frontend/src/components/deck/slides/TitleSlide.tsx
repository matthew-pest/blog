'use client';

import { motion } from 'motion/react';
import { MessageSquare, Bot, Database } from 'lucide-react';
import { DECK } from '@/lib/deck/hogbot';
import { Item, Pill, Stagger } from '../primitives';

export default function TitleSlide() {
  return (
    <Stagger className="grid items-center gap-[3em] lg:grid-cols-[1.25fr_1fr]">
      <div className="flex flex-col gap-[1.2em]">
        <Item as="p" className="eyebrow deck-small">
          A business problem · a technical solution
        </Item>
        <Item as="h1" className="display deck-h1">
          {DECK.title}
        </Item>
        <Item as="p" className="deck-lede max-w-[34ch] text-muted-foreground">
          {DECK.subtitle} — for the traders, quants and developers of a proprietary trading firm.
        </Item>
        <Item className="flex flex-wrap items-center gap-[0.6em] pt-[0.4em]">
          <Pill tone="glow">9 in 10 answers right</Pill>
          <Pill tone="glow">40–50 self-maintained skills</Pill>
          <Pill tone="glow">Tagged every day</Pill>
        </Item>
        <Item as="p" className="deck-small pt-[1em] text-muted-foreground">
          {DECK.presenter} · Principal AI architect · {DECK.minutes} minutes, questions welcome throughout
        </Item>
      </div>

      {/* Slack → agent → data, as a quiet emblem */}
      <Item className="hidden lg:block">
        <motion.svg viewBox="0 0 420 300" className="w-full max-w-[520px] overflow-visible text-foreground/70" aria-hidden>
          <defs>
            <linearGradient id="title-line" x1="0" x2="1">
              <stop offset="0" stopColor="var(--glow-2)" />
              <stop offset="1" stopColor="var(--glow)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M80 150 C 140 150, 150 90, 210 90 S 280 150, 340 150"
            fill="none"
            stroke="url(#title-line)"
            strokeWidth="1.6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.5, ease: 'easeInOut' }}
          />
          <motion.path
            d="M80 150 C 140 150, 150 210, 210 210 S 280 150, 340 150"
            fill="none"
            stroke="url(#title-line)"
            strokeWidth="1.6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.7, ease: 'easeInOut' }}
          />
          <Emblem x={40} y={150} label="Slack" delay={0.3}>
            <MessageSquare className="size-6" />
          </Emblem>
          <Emblem x={210} y={150} label="Hogbot" delay={0.9} accent>
            <Bot className="size-7" />
          </Emblem>
          <Emblem x={380} y={150} label="Logs · metrics · DBs · code" delay={1.3}>
            <Database className="size-6" />
          </Emblem>
        </motion.svg>
      </Item>
    </Stagger>
  );
}

function Emblem({ x, y, label, delay, accent, children }: { x: number; y: number; label: string; delay: number; accent?: boolean; children: React.ReactNode }) {
  const r = accent ? 40 : 32;
  return (
    <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }} style={{ transformOrigin: `${x}px ${y}px` }}>
      <circle cx={x} cy={y} r={r} fill="oklch(0.16 0.012 285 / 85%)" stroke={accent ? 'var(--glow)' : 'oklch(1 0 0 / 14%)'} strokeWidth={accent ? 1.4 : 1} />
      {accent && <circle cx={x} cy={y} r={r + 10} fill="none" stroke="var(--glow)" strokeOpacity={0.3} strokeWidth={1} />}
      <foreignObject x={x - 16} y={y - 16} width={32} height={32}>
        <div className={accent ? 'grid size-8 place-items-center text-glow' : 'grid size-8 place-items-center text-foreground/80'}>{children}</div>
      </foreignObject>
      <text x={x} y={y + r + 22} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
        {label}
      </text>
    </motion.g>
  );
}
