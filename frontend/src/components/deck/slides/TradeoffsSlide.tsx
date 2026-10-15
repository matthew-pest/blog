'use client';

import { ArrowRightLeft, Boxes, BookOpenCheck, FolderGit2, Hand, Scissors, ShieldAlert } from 'lucide-react';
import { Card, Item, Pill, SlideHeader, Stagger } from '../primitives';

const TRADEOFFS = [
  {
    icon: ArrowRightLeft,
    chose: 'Socket Mode (outbound websocket)',
    over: 'polling a cloud DB, or inbound webhooks',
    why: 'No ingress into the on-prem network, no extra database, second-level latency.',
    cost: 'A long-lived connection to keep healthy; Slack bills it as a development feature.',
  },
  {
    icon: Boxes,
    chose: 'One session, optional cheaper workers',
    over: 'a planner with mandatory subagents',
    why: 'Context stays in one place; the best model plans, Haiku-class models execute.',
    cost: 'Longer single contexts; parallelism only when it pays.',
  },
  {
    icon: BookOpenCheck,
    chose: 'Scripts first, MCP to course-correct',
    over: 'hand-written scripts (v1) or free exploration (v2)',
    why: 'Fast, repeatable lookups — and a way to handle a question nobody scripted.',
    cost: 'A skills library that needs review and nightly evals; it can learn the wrong lesson.',
  },
  {
    icon: FolderGit2,
    chose: 'A local mirror of 300 repos',
    over: 'vector or graph RAG',
    why: 'Immediately usable for interrelated algos, services and configs; RAG took too long to pay off.',
    cost: 'Disk, a nightly sync, and trusting the agent to navigate the tree.',
  },
  {
    icon: Scissors,
    chose: 'Brevity and a max-steps budget',
    over: 'open-ended reasoning',
    why: 'Traders read on a phone between trades and won’t wait ten minutes.',
    cost: 'Detail is one follow-up away; a hard budget can cut a deep dig short.',
  },
  {
    icon: Hand,
    chose: 'Human in the loop',
    over: 'full autonomy',
    why: 'Ambiguous asks and actions get a question back in the thread.',
    cost: 'Slower turnaround on exactly those asks.',
  },
];

const LIMITS = [
  'Without a script, the agent is non-deterministic — evals over tests',
  'Self-edited skills can learn the wrong lesson — review required',
  'Cost scales with usage',
  'Coverage bounded by MCP servers and what the lakes hold',
];

export default function TradeoffsSlide() {
  return (
    <div className="flex flex-col gap-[1.1em]">
      <SlideHeader kicker="04 · Tradeoffs" title="What we chose, and what it cost" lede="Each choice was made against a reasonable alternative; the cost is what we live with." />

      <Stagger className="grid gap-[0.7em] sm:grid-cols-2 xl:grid-cols-3">
        {TRADEOFFS.map((t) => (
          <Card key={t.chose} className="flex flex-col gap-[0.5em] !p-[0.9em]">
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
