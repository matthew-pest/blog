'use client';

import { motion } from 'motion/react';
import { Boxes, Database, FolderGit2, ScrollText, Settings2, Users, AlertTriangle } from 'lucide-react';
import { Card, Item, Pill, SlideHeader, Stagger } from '../primitives';

const SOURCES = [
  { icon: Database, name: 'TimescaleDB', sub: 'trades, vol, product reference, params schema' },
  { icon: Database, name: 'Drop-copy DB', sub: 'every iLink message to and from the exchange' },
  { icon: Database, name: 'Strategy-specific schemas', sub: 'no table of all orders — each strategy keeps its own' },
  { icon: Boxes, name: 'Two Parquet lakes', sub: 'MBP history; later a full-depth MBO lake from pcaps' },
  { icon: ScrollText, name: 'Loki logs', sub: 'some apps print 5-level MBO on a fill — sometimes enough' },
  { icon: FolderGit2, name: '~300 repositories', sub: 'many deployed several times with different configs' },
  { icon: Settings2, name: 'Configs and params', sub: 'GitLab CI, Dockerfiles, compose, per-instance TOML' },
];

const NEEDS = ['Traders change nothing about how they ask', 'Minutes, not hours', 'Experts stop being the bottleneck', 'An open-ended question space'];

/** A schematic trade ladder: our quotes vs. the market's fills, one row in question. */
function Ladder() {
  const rows = [
    { ours: 0.18, theirs: 0.55 },
    { ours: 0.3, theirs: 0.62 },
    { ours: 0.52, theirs: 0.5, hot: true },
    { ours: 0.66, theirs: 0.7 },
    { ours: 0.4, theirs: 0.58 },
    { ours: 0.24, theirs: 0.44 },
  ];
  return (
    <svg viewBox="0 0 320 132" className="w-full rounded-lg bg-ink/70" aria-hidden>
      {rows.map((r, i) => {
        const y = 12 + i * 20;
        return (
          <g key={i}>
            <line x1="12" x2="308" y1={y} y2={y} stroke="oklch(1 0 0 / 7%)" />
            <motion.circle cx={12 + r.theirs * 296} cy={y} r="3.2" fill="oklch(0.75 0.02 285)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.08 }} />
            <motion.rect x={12 + r.ours * 296 - 6} y={y - 2.5} width="12" height="5" rx="1.5" fill={r.hot ? 'var(--glow)' : 'var(--glow-2)'} initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.7 + i * 0.08 }} />
            {r.hot && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                <rect x="6" y={y - 9} width="308" height="18" rx="4" fill="none" stroke="var(--glow)" strokeOpacity="0.7" strokeDasharray="3 3" />
                <text x="300" y={y + 4} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--glow)">
                  ?
                </text>
              </motion.g>
            )}
          </g>
        );
      })}
      <text x="12" y="128" fontSize="7" fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
        ■ our quotes · ● market fills
      </text>
    </svg>
  );
}

export default function ProblemSlide() {
  return (
    <div className="flex flex-col gap-[1.6em]">
      <SlideHeader
        kicker="01 · The problem"
        title="A screenshot and six words"
        lede="All day, traders post sequences that looked wrong and ask a one-line question. Finding the answer could take the two or three people who knew where to look."
      />

      <Stagger className="grid gap-[1.2em] lg:grid-cols-[1fr_1.15fr]">
        {/* Slack message mock */}
        <Card className="flex flex-col gap-[0.8em]">
          <div className="flex items-center gap-[0.6em]">
            <span className="grid size-[2.2em] place-items-center rounded-lg bg-glow-2/20 deck-small font-semibold text-glow-2">TR</span>
            <div className="leading-tight">
              <p className="deck-body font-medium">trader-eu-fx</p>
              <p className="deck-small text-muted-foreground">#desk-questions · 9:42 AM</p>
            </div>
          </div>
          <Ladder />
          <p className="deck-body">
            <span className="rounded bg-glow/15 px-1 text-glow">@hogbot</span> where were our quoters here?
          </p>
          <p className="deck-small text-muted-foreground">
            Variants: “what was our queue priority on this trade?” · “how much faster to beat that fill?” · “why didn’t we shoot for more?”
          </p>
        </Card>

        {/* Where the answer lived */}
        <div className="flex flex-col gap-[0.8em]">
          <Item as="p" className="eyebrow deck-small">
            Where the answer lived
          </Item>
          <ul className="grid gap-[0.5em] sm:grid-cols-2">
            {SOURCES.map((s) => (
              <Item key={s.name} as="li" className="flex items-center gap-[0.7em] rounded-xl border border-border/60 bg-background/30 px-[0.9em] py-[0.6em]">
                <s.icon className="size-[1.2em] shrink-0 text-glow-2" />
                <div className="min-w-0 leading-tight">
                  <p className="deck-body font-medium">{s.name}</p>
                  <p className="deck-small truncate text-muted-foreground">{s.sub}</p>
                </div>
              </Item>
            ))}
            <Item as="li" className="flex items-center gap-[0.7em] rounded-xl border border-glow/40 bg-glow/8 px-[0.9em] py-[0.6em]">
              <Users className="size-[1.2em] shrink-0 text-glow" />
              <div className="leading-tight">
                <p className="deck-body font-medium">2–3 people</p>
                <p className="deck-small text-muted-foreground">knew where to look and how</p>
              </div>
            </Item>
          </ul>
          <Item className="flex items-start gap-[0.6em] deck-small text-muted-foreground">
            <AlertTriangle className="mt-[0.15em] size-[1em] shrink-0 text-glow" />
            <span>
              When the first source didn’t explain what the trader saw, investigations stalled. Queue-priority questions needed the pcap parser: hours per run, one box,
              SSH, a CLI — so the most common question went mostly unanswered.
            </span>
          </Item>
        </div>
      </Stagger>

      <Stagger className="flex flex-wrap items-center gap-[0.6em]">
        <Item as="p" className="eyebrow deck-small mr-[0.4em]">
          What the business needed
        </Item>
        {NEEDS.map((n) => (
          <Item key={n}>
            <Pill tone="glow-2">{n}</Pill>
          </Item>
        ))}
      </Stagger>
    </div>
  );
}
