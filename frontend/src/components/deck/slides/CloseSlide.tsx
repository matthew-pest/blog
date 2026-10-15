'use client';

import { Sparkles } from 'lucide-react';
import { useAgentStore } from '@/lib/agent-state';
import { Card, Item, SlideHeader, Stagger } from '../primitives';

const LESSONS = [
  { n: '01', title: 'Put the agent where the people already are', body: 'Slack was the interface traders already used. Adoption was never a project; it was a tag.' },
  { n: '02', title: 'Native access and an editable memory beat a bigger prompt', body: 'MCP servers for the systems, a skills repo the agent can revise — not an ever-growing system prompt.' },
  { n: '03', title: 'Measure correctness every night', body: 'A non-deterministic system drifts quietly. The nightly eval set is what made the learning loop safe to run.' },
];

export default function CloseSlide() {
  const setDockOpen = useAgentStore((s) => s.setDockOpen);
  const setDraft = useAgentStore((s) => s.setDraft);

  return (
    <div className="flex flex-col gap-[1.6em]">
      <SlideHeader kicker="06 · Lessons" title="What I would tell my past self" />

      <Stagger className="grid gap-[0.8em] lg:grid-cols-3">
        {LESSONS.map((l) => (
          <Card key={l.n} className="flex flex-col gap-[0.5em]">
            <span className="font-mono deck-small text-glow">{l.n}</span>
            <p className="deck-h3 display">{l.title}</p>
            <p className="deck-small leading-relaxed text-muted-foreground">{l.body}</p>
          </Card>
        ))}
      </Stagger>

      <Stagger className="flex flex-wrap items-end justify-between gap-[1em] pt-[0.6em]">
        <Item>
          <p className="display deck-h1">Questions?</p>
          <p className="deck-small mt-[0.4em] text-muted-foreground">mattpest.com · the deck agent can jump back to any slide or iteration.</p>
        </Item>
        <Item>
          <button
            type="button"
            onClick={() => {
              setDraft('Show the architecture, v3, and spotlight the skills repo');
              setDockOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-glow/50 bg-glow/10 px-4 py-2 deck-small transition-colors hover:bg-glow/20"
          >
            <Sparkles className="size-[1em] text-glow" />
            Ask the deck agent
          </button>
        </Item>
      </Stagger>
    </div>
  );
}
