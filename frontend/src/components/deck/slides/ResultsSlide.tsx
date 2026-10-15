'use client';

import { motion } from 'motion/react';
import { ADOPTION_WEEKLY, METRICS, QUESTION_CLASSES, type Metric } from '@/lib/deck/hogbot';
import { cn } from '@/lib/utils';
import { Card, Item, SlideHeader, Stagger } from '../primitives';

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

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 240;
  const h = 64;
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / max) * (h - 6) - 2] as const);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('w-full overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--glow)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--glow)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#spark-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }} />
      <motion.path d={d} fill="none" stroke="var(--glow)" strokeWidth="2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 1.4, ease: 'easeInOut' }} />
      <motion.circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--glow)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }} />
    </svg>
  );
}

export default function ResultsSlide() {
  const correctness = METRICS.find((m) => m.id === 'correctness')!;
  const skills = METRICS.find((m) => m.id === 'skills')!;
  const others = METRICS.filter((m) => ['speed', 'cost', 'brevity'].includes(m.id));
  const anyEstimate = METRICS.some((m) => m.estimate);

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
              <p className="eyebrow deck-small">
                {m.label}
                {m.estimate && <sup className="text-glow"> †</sup>}
              </p>
              <Bars metric={m} />
              {m.baseline && <p className="deck-small text-muted-foreground">{m.baseline}</p>}
            </Card>
          ))}
        </div>
      </Stagger>

      <Stagger className="grid gap-[0.8em] lg:grid-cols-[1fr_1fr_1.3fr]">
        <Card className="flex flex-col gap-[0.4em]">
          <p className="eyebrow deck-small">Capability growth · {skills.label.toLowerCase()}</p>
          <Bars metric={skills} />
          <p className="deck-small text-muted-foreground">Written and revised by the agent, reviewed by the team, versioned in GitLab.</p>
        </Card>
        <Card className="flex flex-col gap-[0.4em]">
          <p className="eyebrow deck-small">
            Adoption · weekly mentions<sup className="text-glow"> †</sup>
          </p>
          <Sparkline values={ADOPTION_WEEKLY} className="mt-[0.4em]" />
          <p className="deck-small text-muted-foreground">Tagged every day; asked to do work a quant or developer would have done.</p>
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

      {anyEstimate && (
        <Item as="p" className="deck-small text-muted-foreground/70">
          † operating estimates, not instrumented measurements; correctness and skill counts are tracked.
        </Item>
      )}
    </div>
  );
}
