'use client';

import { motion } from 'motion/react';
import { AtSign, ScanSearch, BookOpen, Plug, MessageCircleQuestion, Reply, Workflow, Fingerprint, Hand } from 'lucide-react';
import { Card, Item, SlideHeader, Stagger } from '../primitives';

const STEPS = [
  { icon: AtSign, title: 'Tag it in Slack', sub: 'screenshot + a few words — nothing new to learn' },
  { icon: ScanSearch, title: 'Read the screenshot', sub: 'find the trade they mean among 3–30 on screen' },
  { icon: BookOpen, title: 'Pick a skill', sub: 'where to look, in what order, for this kind of question' },
  { icon: Plug, title: 'Investigate through MCP', sub: 'Loki · Prometheus · DBs · Parquet · ~300 repos' },
  { icon: MessageCircleQuestion, title: 'Ask back when unsure', sub: 'more detail, or permission to act — in the thread' },
  { icon: Reply, title: 'Answer in the thread', sub: 'brief; the detail is a follow-up away' },
];

const PRINCIPLES = [
  { icon: Workflow, title: 'No workflow change', body: 'Slack is the interface. OpenCode is the brain. Traders never leave the thread.' },
  { icon: Fingerprint, title: 'Native access, not guesses', body: 'MCP servers give the agent the same systems the quants used — logs, metrics, tables, the lake, the code.' },
  { icon: Hand, title: 'Human in the loop', body: 'Ambiguous screenshot? Risky action? Hogbot asks first, in the same thread.' },
];

export default function SolutionSlide() {
  return (
    <div className="flex flex-col gap-[1.5em]">
      <SlideHeader
        kicker="02 · The solution"
        title="Hogbot: the agent that goes looking"
        lede="An agent defined in OpenCode, reached through Slack, wired into every system a quant would have opened — and allowed to ask back."
      />

      {/* Flow */}
      <Stagger className="relative grid gap-[0.7em] sm:grid-cols-3 xl:grid-cols-6">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[6%] right-[6%] top-[1.9em] hidden h-px origin-left bg-gradient-to-r from-glow-2 via-glow to-glow-2 xl:block"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 1.2, ease: 'easeInOut' }}
        />
        {STEPS.map((s, i) => (
          <Item key={s.title} className="relative flex flex-col gap-[0.5em] rounded-2xl border border-border/60 bg-background/35 p-[0.9em]">
            <div className="flex items-center gap-[0.6em]">
              <span className="relative grid size-[2.4em] place-items-center rounded-full border border-glow/40 bg-ink">
                <s.icon className="size-[1.1em] text-glow" />
              </span>
              <span className="font-mono deck-small text-muted-foreground">0{i + 1}</span>
            </div>
            <p className="deck-body font-medium leading-tight">{s.title}</p>
            <p className="deck-small leading-snug text-muted-foreground">{s.sub}</p>
          </Item>
        ))}
      </Stagger>

      <Stagger className="grid gap-[0.9em] lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-[0.7em] sm:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <Card key={p.title} className="flex flex-col gap-[0.4em]">
              <p.icon className="size-[1.3em] text-glow-2" />
              <p className="deck-body font-medium">{p.title}</p>
              <p className="deck-small leading-snug text-muted-foreground">{p.body}</p>
            </Card>
          ))}
        </div>

        {/* Example thread reply */}
        <Card accent className="flex flex-col gap-[0.5em]">
          <p className="eyebrow deck-small">Illustrative reply · in thread</p>
          <div className="flex items-center gap-[0.5em]">
            <span className="grid size-[1.8em] place-items-center rounded-md bg-glow/20 deck-small font-semibold text-glow">H</span>
            <p className="deck-small text-muted-foreground">hogbot · 9:46 AM</p>
          </div>
          <p className="deck-small leading-snug">
            Our quote was one tick behind from 9:41:58.3. The quoter pulled for a risk-limit check (<span className="font-mono">max_position</span> on this
            instance) and re-quoted 180 ms later — after the fill. This strategy is deployed three times; only this config has the tighter limit.
            Want a ticket for the config diff?
          </p>
          <p className="deck-small text-muted-foreground">Sources: Parquet replay · Prometheus quote latency · strategy config · 2 repos</p>
        </Card>
      </Stagger>
    </div>
  );
}
