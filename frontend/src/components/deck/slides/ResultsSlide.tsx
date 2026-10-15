'use client';

import { motion } from 'motion/react';
import { DECK_IMAGES, METRICS, QUESTION_CLASSES, type Metric } from '@/lib/deck/hogbot';
import { cn } from '@/lib/utils';
import { Card, Item, SlideHeader, Stagger } from '../primitives';
import Figure, { deckAsset } from '../Figure';

const LABELS = ['v1', 'v2', 'v3'];

function fmt(v: number, unit?: string) {
  if (unit === '×') return `${v}×`;
  if (unit === '%') return `${v}%`;
  return unit ? `${v} ${unit}` : String(v);
}

/** Three bars, one per iteration; the best value is lit. */
function Bars({ metric, className }: { metric: Metric; className?: string }) {
  const max = Math.max(...metric.byIteration);
  const best = metric.lowerIsBetter ? Math.min(...metric.byIteration) : max;
  return (
    <div className={cn('flex items-end gap-[0.5em]', className)} role="img" aria-label={`${metric.label}: ${metric.byIteration.map((v, i) => `${LABELS[i]} ${fmt(v, metric.unit)}`).join(', ')}`}>
      {metric.byIteration.map((v, i) => {
        const h = Math.max(0.06, v / max);
        const lit = v === best;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-[0.3em]">
            <span className={cn('deck-small font-mono', lit ? 'text-glow' : 'text-muted-foreground')}>{metric.display?.[i] ?? fmt(v, metric.unit)}</span>
            <div className="flex h-[3.2em] w-full items-end">
              <motion.div
                className={cn('w-full rounded-t-[0.3em]', lit ? 'bg-glow' : 'bg-foreground/25')}
                initial={{ height: 0 }}
                animate={{ height: `${h * 100}%` }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
              />
            </div>
            <span className="deck-small font-mono text-muted-foreground">{LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ResultsSlide() {
  const correctness = METRICS.find((m) => m.id === 'correctness')!;
  const skills = METRICS.find((m) => m.id === 'skills')!;
  const others = METRICS.filter((m) => ['speed', 'cost', 'brevity'].includes(m.id));

  return (
    <div className="flex flex-col gap-[1.3em]">
      <SlideHeader kicker="05 · Results" title="Nine in ten, in minutes, every day" />

      <Stagger className="grid gap-[0.8em] lg:grid-cols-[1.1fr_2fr]">
        {/* Correctness hero */}
        <Card accent className="flex flex-col justify-between gap-[0.8em]">
          <div>
            <p className="eyebrow deck-small">{correctness.label}</p>
            <p className="display deck-h1 mt-[0.1em] text-glow">
              9<span className="text-foreground/40">/</span>10
            </p>
            <p className="deck-small text-muted-foreground">from 1 in 3 at best on v1</p>
          </div>
          <Bars metric={correctness} />
        </Card>

        <div className="grid gap-[0.8em] sm:grid-cols-3">
          {others.map((m) => (
            <Card key={m.id} className="flex flex-col gap-[0.6em]">
              <p className="eyebrow deck-small">{m.label}</p>
              <Bars metric={m} />
              {m.baseline && <p className="deck-small text-muted-foreground">{m.baseline}</p>}
            </Card>
          ))}
        </div>
      </Stagger>

      <Stagger className="grid gap-[0.8em] lg:grid-cols-[1fr_1.4fr_1.3fr]">
        <Card className="flex flex-col gap-[0.4em]">
          <p className="eyebrow deck-small">Capability growth · {skills.label.toLowerCase()}</p>
          <Bars metric={skills} />
          <p className="deck-small text-muted-foreground">Written and revised by the agent, reviewed by the team, versioned in GitLab.</p>
        </Card>
        <Card className="flex flex-col gap-[0.5em]">
          <p className="eyebrow deck-small">Latency, measured · LangSmith · Jul–Oct 2026</p>
          <div className="grid grid-cols-2 gap-[0.6em]">
            <Figure src={deckAsset(DECK_IMAGES.traceLatency.src)} alt={DECK_IMAGES.traceLatency.alt} imgClassName="max-h-[9em]" caption={<span>Trace P50 <span className="text-foreground">~200 s → ~50 s</span></span>} />
            <Figure src={deckAsset(DECK_IMAGES.llmLatency.src)} alt={DECK_IMAGES.llmLatency.alt} imgClassName="max-h-[9em]" caption={<span>LLM P99 <span className="text-foreground">~220 s → ~50 s</span></span>} />
          </div>
          <p className="deck-small text-muted-foreground">The step down in early September is the scripts-first release. Click to enlarge.</p>
        </Card>
        <Card className="flex flex-col gap-[0.4em]">
          <p className="eyebrow deck-small">The question space it covers now</p>
          <ul className="grid gap-[0.25em] deck-small">
            {QUESTION_CLASSES.map((q, i) => (
              <Item key={q} as="li" className="flex gap-[0.5em] leading-snug">
                <span className="font-mono text-glow-2">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-foreground/90">{q}</span>
              </Item>
            ))}
          </ul>
        </Card>
      </Stagger>

    </div>
  );
}
