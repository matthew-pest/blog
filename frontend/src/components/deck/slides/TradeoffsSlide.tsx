'use client';

import { ArrowRightLeft, Boxes, BookOpenCheck, Hand, Scissors, ShieldAlert } from 'lucide-react';
import { Card, Item, Pill, SlideHeader, Stagger } from '../primitives';

const TRADEOFFS = [
  {
    icon: ArrowRightLeft,
    chose: 'Inbound webhooks',
    over: 'polling a cloud queue',
    why: 'Seconds instead of minutes, and one fewer system to run.',
    cost: 'An ingress path into the on-prem network — mitigated with Slack request signing and an allow-listed proxy.',
  },
  {
    icon: Boxes,
    chose: 'One agent session, optional workers',
    over: 'a planner with mandatory subagents',
    why: 'Context stays in one place; correctness jumped the most on this change.',
    cost: 'Longer single contexts; parallelism only when it pays.',
  },
  {
    icon: BookOpenCheck,
    chose: 'Skills the agent maintains',
    over: 'pre-scripted tools per question',
    why: 'The only way to cover an open-ended question space.',
    cost: 'Drift and regressions — so skills go through GitLab review and nightly evals.',
  },
  {
    icon: Hand,
    chose: 'Human in the loop',
    over: 'full autonomy',
    why: 'Screenshots are ambiguous and some requests take actions.',
    cost: 'Slower turnaround on ambiguous asks.',
  },
  {
    icon: Scissors,
    chose: 'Brevity',
    over: 'completeness',
    why: 'Traders read on a phone between trades.',
    cost: 'Detail is one follow-up away — sometimes two.',
  },
];

const LIMITS = ['Screenshot reading is still the weakest link', 'Non-deterministic: evals matter more than tests', 'Cost scales with usage', 'Coverage bounded by MCP servers available'];

export default function TradeoffsSlide() {
  return (
    <div className="flex flex-col gap-[1.4em]">
      <SlideHeader kicker="04 · Tradeoffs" title="What we chose, and what it cost" lede="Every decision below was a choice against a reasonable alternative. The benefit is what we got; the cost is what we live with." />

      <Stagger className="grid gap-[0.8em] sm:grid-cols-2 xl:grid-cols-5">
        {TRADEOFFS.map((t) => (
          <Card key={t.chose} className="flex flex-col gap-[0.6em]">
            <t.icon className="size-[1.3em] text-glow" />
            <div className="leading-tight">
              <p className="deck-small text-muted-foreground">Chose</p>
              <p className="deck-body font-medium">{t.chose}</p>
              <p className="deck-small text-muted-foreground">
                over <span className="text-foreground/80">{t.over}</span>
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-[0.5em] border-t border-border/60 pt-[0.6em]">
              <p className="deck-small leading-snug">
                <span className="font-mono text-glow-2">why </span>
                {t.why}
              </p>
              <p className="deck-small leading-snug text-muted-foreground">
                <span className="font-mono text-glow">cost </span>
                {t.cost}
              </p>
            </div>
          </Card>
        ))}
      </Stagger>

      <Stagger className="flex flex-wrap items-center gap-[0.6em]">
        <Item className="mr-[0.4em] inline-flex items-center gap-[0.5em] eyebrow deck-small">
          <ShieldAlert className="size-[1.1em] text-glow" /> Limitations
        </Item>
        {LIMITS.map((l) => (
          <Item key={l}>
            <Pill>{l}</Pill>
          </Item>
        ))}
      </Stagger>
    </div>
  );
}
