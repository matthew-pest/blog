'use client';

import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/lib/agent-state';
import { ARCHITECTURE } from '@/lib/deck/hogbot';
import ArchitectureDiagram, { KIND } from '../ArchitectureDiagram';
import { Item, SlideHeader, Stagger } from '../primitives';

export default function ArchitectureSlide() {
  const iteration = useAgentStore((s) => s.deck.iteration);
  const focus = useAgentStore((s) => s.deck.focus);
  const setDeck = useAgentStore((s) => s.setDeck);
  const it = ARCHITECTURE.find((a) => a.id === iteration) ?? ARCHITECTURE[0];
  const focused = focus ? it.nodes.find((n) => n.id === focus) : null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-[1em]">
      <div className="flex flex-wrap items-end justify-between gap-[1em]">
        <SlideHeader kicker="03 · Architecture" title="Three iterations" />
        <Stagger className="flex items-center gap-[0.4em]" >
          {ARCHITECTURE.map((a) => (
            <Item key={a.id}>
              <button
                type="button"
                onClick={() => setDeck({ iteration: a.id, focus: null })}
                aria-pressed={a.id === iteration}
                className={cn(
                  'flex items-center gap-[0.6em] rounded-full border px-[1em] py-[0.5em] deck-small transition-colors',
                  a.id === iteration ? 'border-glow/60 bg-glow/15 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                <span className="font-mono">v{a.id}</span>
                <span className="hidden sm:inline">{a.name}</span>
              </button>
            </Item>
          ))}
          <Item>
            <span className="kbd ml-[0.4em] hidden lg:inline">V</span>
          </Item>
        </Stagger>
      </div>

      <Stagger className="grid min-h-0 flex-1 gap-[1em] lg:grid-cols-[1.9fr_1fr]">
        <Item className="min-h-0">
          <ArchitectureDiagram iteration={iteration} focus={focus} onFocus={(id) => setDeck({ focus: id })} className="mx-auto max-h-full" />
          <div className="mt-[0.6em] flex flex-wrap items-center gap-x-[1em] gap-y-[0.3em] deck-small text-muted-foreground">
            {(['cloud', 'proxy', 'agent', 'data', 'skills', 'ops'] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-[0.4em]">
                <span className="size-[0.6em] rounded-full" style={{ background: KIND[k].color }} />
                {KIND[k].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-[0.4em]">
              <span className="size-[0.6em] rounded-full bg-glow" /> new in this iteration
            </span>
            <span className="ml-auto hidden xl:inline">hover for detail · click to spotlight</span>
          </div>
        </Item>

        {/* Side panel */}
        <Item className="relative min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background/35 p-[1.1em] backdrop-blur-sm">
          <AnimatePresence mode="wait" initial={false}>
            {focused ? (
              <motion.div key={`node-${focused.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex h-full flex-col gap-[0.6em]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="eyebrow deck-small">Component · v{iteration}</p>
                    <p className="display deck-h3 mt-[0.2em]">{focused.label}</p>
                    {focused.sub && <p className="deck-small text-muted-foreground">{focused.sub}</p>}
                  </div>
                  <button type="button" onClick={() => setDeck({ focus: null })} aria-label="Clear spotlight" className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="deck-body leading-relaxed text-foreground/90">{focused.tip}</p>
                <p className="mt-auto deck-small text-muted-foreground">
                  <span className="inline-block size-[0.6em] rounded-full align-middle" style={{ background: KIND[focused.kind].color }} /> {KIND[focused.kind].label}
                  {focused.changed && <span className="ml-2 text-glow">· new in v{iteration}</span>}
                </p>
              </motion.div>
            ) : (
              <motion.div key={`it-${it.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex h-full flex-col gap-[0.7em] overflow-y-auto">
                <div>
                  <p className="eyebrow deck-small">
                    v{it.id} · {it.name}
                  </p>
                  <p className="display deck-h3 mt-[0.2em]">{it.tagline}</p>
                </div>
                <p className="deck-small leading-relaxed text-foreground/85">{it.summary}</p>
                {it.changed.length > 0 && (
                  <div>
                    <p className="eyebrow deck-small text-glow">What changed</p>
                    <ul className="mt-[0.3em] flex flex-col gap-[0.3em]">
                      {it.changed.map((c) => (
                        <li key={c} className="flex gap-[0.5em] deck-small leading-snug">
                          <span className="mt-[0.5em] size-[0.45em] shrink-0 rounded-full bg-glow" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {it.pain && it.pain.length > 0 && (
                  <div>
                    <p className="eyebrow deck-small text-glow-2">Why there was a next version</p>
                    <ul className="mt-[0.3em] flex flex-col gap-[0.3em]">
                      {it.pain.map((c) => (
                        <li key={c} className="flex gap-[0.5em] deck-small leading-snug text-muted-foreground">
                          <span className="mt-[0.5em] size-[0.45em] shrink-0 rounded-full bg-glow-2" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Item>
      </Stagger>
    </div>
  );
}
