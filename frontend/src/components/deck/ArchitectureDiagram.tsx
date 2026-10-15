'use client';

import { useMemo, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  Bot,
  Boxes,
  CalendarClock,
  Cloud,
  Database,
  FolderGit2,
  GitBranch,
  Layers,
  MessageSquare,
  Radio,
  ScrollText,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ARCHITECTURE, type ArchEdge, type ArchNode, type NodeKind } from '@/lib/deck/hogbot';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const CANVAS_W = 1000;
export const CANVAS_H = 560;
const DEFAULT_W = 150;
const DEFAULT_H = 62;
const VPN_X = 400;

export const KIND: Record<NodeKind, { color: string; icon: LucideIcon; label: string }> = {
  people: { color: 'oklch(0.85 0.02 285)', icon: Users, label: 'People' },
  cloud: { color: 'oklch(0.8 0.1 225)', icon: Cloud, label: 'Cloud / SaaS' },
  proxy: { color: 'oklch(0.82 0.13 70)', icon: Radio, label: 'Edge proxy' },
  agent: { color: 'oklch(0.82 0.13 70)', icon: Bot, label: 'Agent' },
  data: { color: 'oklch(0.78 0.11 170)', icon: Database, label: 'Data systems' },
  repo: { color: 'oklch(0.78 0.11 170)', icon: FolderGit2, label: 'Code' },
  skills: { color: 'oklch(0.78 0.14 300)', icon: BookOpen, label: 'Skills' },
  ops: { color: 'oklch(0.78 0.15 350)', icon: Activity, label: 'Observability' },
};

const ICON: Record<string, LucideIcon> = {
  slack: MessageSquare,
  loki: ScrollText,
  prom: Activity,
  parquet: Boxes,
  skillsrepo: GitBranch,
  scheduler: CalendarClock,
  subagents: Layers,
  workers: Layers,
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rect(n: ArchNode): Rect {
  return { x: n.x, y: n.y, w: n.w ?? DEFAULT_W, h: n.h ?? DEFAULT_H };
}

/** A cubic path between two node rectangles, leaving from the facing sides. */
function edgePath(a: Rect, b: Rect, back?: boolean) {
  const off = back ? 14 : 0;
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  let p0: [number, number], p3: [number, number], p1: [number, number], p2: [number, number];
  if (b.x >= a.x + a.w - 4) {
    // B to the right
    p0 = [a.x + a.w, acy + off];
    p3 = [b.x, bcy + off];
    const dx = (p3[0] - p0[0]) * 0.5;
    p1 = [p0[0] + dx, p0[1]];
    p2 = [p3[0] - dx, p3[1]];
  } else if (b.x + b.w <= a.x + 4) {
    // B to the left
    p0 = [a.x, acy + off];
    p3 = [b.x + b.w, bcy + off];
    const dx = (p0[0] - p3[0]) * 0.5;
    p1 = [p0[0] - dx, p0[1]];
    p2 = [p3[0] + dx, p3[1]];
  } else if (b.y >= a.y) {
    // B below
    p0 = [acx + off, a.y + a.h];
    p3 = [bcx + off, b.y];
    const dy = (p3[1] - p0[1]) * 0.5;
    p1 = [p0[0], p0[1] + dy];
    p2 = [p3[0], p3[1] - dy];
  } else {
    // B above
    p0 = [acx + off, a.y];
    p3 = [bcx + off, b.y + b.h];
    const dy = (p0[1] - p3[1]) * 0.5;
    p1 = [p0[0], p0[1] - dy];
    p2 = [p3[0], p3[1] + dy];
  }
  const d = `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
  const mid = {
    x: 0.125 * p0[0] + 0.375 * p1[0] + 0.375 * p2[0] + 0.125 * p3[0],
    y: 0.125 * p0[1] + 0.375 * p1[1] + 0.375 * p2[1] + 0.125 * p3[1],
  };
  return { d, mid };
}

function Zone({ x, y, w, h, label, accent }: Rect & { label: string; accent?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn('absolute rounded-2xl border border-dashed', accent ? 'border-glow/25' : 'border-foreground/12')}
      style={{ left: pct(x, CANVAS_W), top: pct(y, CANVAS_H), width: pct(w, CANVAS_W), height: pct(h, CANVAS_H) }}
    >
      <span className="absolute left-[1cqw] top-[0.8cqw] font-mono text-[1.05cqw] uppercase tracking-[0.14em] text-muted-foreground/80">{label}</span>
    </div>
  );
}

function pct(v: number, of: number) {
  return `${(v / of) * 100}%`;
}

export interface ArchitectureDiagramProps {
  iteration: 1 | 2 | 3;
  focus: string | null;
  onFocus: (id: string | null) => void;
  className?: string;
}

/**
 * The evolving system diagram. Nodes keep their ids across iterations so they
 * glide to new positions; edges re-route; new components fade in with a dot.
 */
export default function ArchitectureDiagram({ iteration, focus, onFocus, className }: ArchitectureDiagramProps) {
  const it = ARCHITECTURE.find((a) => a.id === iteration) ?? ARCHITECTURE[0];
  const byId = useMemo(() => new Map(it.nodes.map((n) => [n.id, n])), [it]);
  const edges = useMemo(
    () =>
      it.edges
        .map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          return { ...e, ...edgePath(rect(a), rect(b), e.back) };
        })
        .filter((e): e is ArchEdge & { d: string; mid: { x: number; y: number } } => e != null),
    [it, byId]
  );
  const connected = useMemo(() => {
    const set = new Set<string>();
    if (!focus) return set;
    for (const e of it.edges) {
      if (e.from === focus) set.add(e.to);
      if (e.to === focus) set.add(e.from);
    }
    return set;
  }, [focus, it]);

  return (
    <div className={cn('relative w-full select-none @container', className)} style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }} onClick={() => onFocus(null)}>
      <Zone x={0} y={0} w={148} h={CANVAS_H} label="Traders" />
      <Zone x={160} y={0} w={190} h={CANVAS_H} label="Slack · cloud" />
      <Zone x={VPN_X + 6} y={0} w={CANVAS_W - VPN_X - 6} h={CANVAS_H} label="On-prem · behind the VPN" accent />
      <div aria-hidden className="absolute bottom-0 top-0 border-l border-dashed border-glow/50" style={{ left: pct(VPN_X, CANVAS_W) }}>
        <span className="absolute -left-[1.6cqw] top-1/2 -translate-y-1/2 -rotate-90 font-mono text-[0.95cqw] uppercase tracking-[0.2em] text-glow/80">VPN</span>
      </div>

      {/* Edges */}
      <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <marker id="arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
          </marker>
        </defs>
        <AnimatePresence initial={false}>
          {edges.map((e) => {
            const dim = focus != null && e.from !== focus && e.to !== focus;
            return (
              <motion.g
                key={`${e.from}->${e.to}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: dim ? 0.18 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-foreground/45"
              >
                <motion.path
                  initial={false}
                  animate={{ d: e.d }}
                  transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.3}
                  strokeDasharray={e.dashed ? '5 6' : undefined}
                  markerEnd="url(#arch-arrow)"
                  vectorEffect="non-scaling-stroke"
                />
                <motion.path
                  initial={false}
                  animate={{ d: e.d }}
                  transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                  fill="none"
                  stroke={e.back ? 'var(--glow-2)' : 'var(--glow)'}
                  strokeOpacity={0.75}
                  strokeWidth={1.6}
                  className={cn('deck-flow', e.back && 'deck-flow-back')}
                  vectorEffect="non-scaling-stroke"
                />
                {e.label && (
                  <motion.text
                    initial={false}
                    animate={{ x: e.mid.x, y: e.back ? e.mid.y + 18 : e.mid.y - 7 }}
                    transition={{ type: 'spring', stiffness: 170, damping: 26 }}
                    textAnchor="middle"
                    fontSize={12}
                    fontFamily="var(--font-mono)"
                    fill="var(--muted-foreground)"
                    style={{ paintOrder: 'stroke', stroke: 'var(--ink)', strokeWidth: 5, strokeLinejoin: 'round' }}
                  >
                    {e.label}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Nodes */}
      <AnimatePresence initial={false}>
        {it.nodes.map((node) => {
          const k = KIND[node.kind];
          const Icon = ICON[node.id] ?? k.icon;
          const r = rect(node);
          const isFocus = focus === node.id;
          const dim = (focus != null && !isFocus && !connected.has(node.id)) || (node.unreachable && !isFocus);
          return (
            <Tooltip key={node.id}>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  layout
                  aria-pressed={isFocus}
                  aria-label={`${node.label}${node.sub ? `: ${node.sub}` : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: dim ? 0.35 : 1, scale: isFocus ? 1.05 : 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                  transition={{ layout: { type: 'spring', stiffness: 170, damping: 26 }, opacity: { duration: 0.35 }, scale: { duration: 0.35 } }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocus(isFocus ? null : node.id);
                  }}
                  style={
                    {
                      left: pct(r.x, CANVAS_W),
                      top: pct(r.y, CANVAS_H),
                      width: pct(r.w, CANVAS_W),
                      height: pct(r.h, CANVAS_H),
                      '--node': k.color,
                      borderColor: isFocus ? k.color : `color-mix(in oklab, ${k.color} 38%, transparent)`,
                      background: `color-mix(in oklab, ${k.color} ${node.kind === 'agent' ? 14 : 7}%, oklch(0.15 0.012 285 / 88%))`,
                      boxShadow: isFocus ? `0 0 0 0.4cqw color-mix(in oklab, ${k.color} 30%, transparent), 0 1.2cqw 3cqw -1.2cqw oklch(0 0 0 / 70%)` : '0 1cqw 2.4cqw -1.4cqw oklch(0 0 0 / 60%)',
                    } as CSSProperties
                  }
                  className={cn(
                    'absolute flex cursor-pointer items-center gap-[0.8cqw] rounded-[1cqw] border px-[0.9cqw] text-left backdrop-blur-sm transition-shadow',
                    isFocus && 'z-10',
                    node.unreachable && 'border-dashed'
                  )}
                >
                  <span className="grid size-[2.7cqw] shrink-0 place-items-center rounded-[0.7cqw]" style={{ background: `color-mix(in oklab, ${k.color} 18%, transparent)` }}>
                    <Icon className="size-[1.5cqw]" style={{ color: k.color }} />
                  </span>
                  <span className="min-w-0 leading-[1.15]">
                    <span className="block truncate text-[1.3cqw] font-medium text-foreground">{node.label}</span>
                    {node.sub && <span className="block truncate text-[1cqw] text-muted-foreground">{node.sub}</span>}
                  </span>
                  {node.changed && (
                    <span aria-hidden className="absolute -right-[0.4cqw] -top-[0.4cqw] size-[1.1cqw] rounded-full bg-glow" style={{ boxShadow: '0 0 0 0.3cqw var(--ink)' }} />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6} className={cn('border border-border bg-popover px-3 py-2 text-popover-foreground shadow-xl', node.image ? 'max-w-md' : 'max-w-xs')}>
                <p className="text-xs font-medium">{node.label}</p>
                <p className="mt-1 text-[0.72rem] leading-snug text-muted-foreground">{node.tip}</p>
                {node.image && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-border/70 bg-ink/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/presentation/asset/${node.image.src}`} alt={node.image.alt} className="block max-h-56 w-full object-cover object-top" />
                    <p className="px-2 py-1 text-[0.65rem] text-muted-foreground">{node.image.alt}</p>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
