'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, NotebookPen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_HUE, useAgentStore } from '@/lib/agent-state';
import { ARCHITECTURE_SLIDE_INDEX, DECK, SLIDES, SLIDE_COUNT, type SlideId } from '@/lib/deck/hogbot';
import TitleSlide from './slides/TitleSlide';
import ProblemSlide from './slides/ProblemSlide';
import SolutionSlide from './slides/SolutionSlide';
import ArchitectureSlide from './slides/ArchitectureSlide';
import TradeoffsSlide from './slides/TradeoffsSlide';
import ResultsSlide from './slides/ResultsSlide';
import CloseSlide from './slides/CloseSlide';

const COMPONENTS: Record<SlideId, ComponentType> = {
  title: TitleSlide,
  problem: ProblemSlide,
  solution: SolutionSlide,
  architecture: ArchitectureSlide,
  tradeoffs: TradeoffsSlide,
  results: ResultsSlide,
  close: CloseSlide,
};

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 36 * dir, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: [0.2, 0.7, 0.2, 1] } },
  exit: (dir: number) => ({ opacity: 0, x: -36 * dir, filter: 'blur(6px)', transition: { duration: 0.28, ease: 'easeIn' } }),
};

function clampSlide(i: number) {
  return Math.max(0, Math.min(SLIDE_COUNT - 1, i));
}

/**
 * The slide deck engine. The current slide lives in the shared store so the
 * agent's deck tools and the keyboard drive the same state; the URL mirrors it
 * (?s=3&v=2) so a refresh lands on the same slide.
 */
export default function Deck() {
  const slide = useAgentStore((s) => s.deck.slide);
  const iteration = useAgentStore((s) => s.deck.iteration);
  const notesOpen = useAgentStore((s) => s.deck.notesOpen);
  const setDeck = useAgentStore((s) => s.setDeck);
  const setPage = useAgentStore((s) => s.setPage);
  const setHue = useAgentStore((s) => s.setHue);
  const dockOpen = useAgentStore((s) => s.dockOpen);
  const toggleDock = useAgentStore((s) => s.toggleDock);

  const [fullscreen, setFullscreen] = useState(false);
  const [curtain, setCurtain] = useState(true);
  const lastSlide = useRef(0);
  const dir = slide >= lastSlide.current ? 1 : -1;
  // Captured on first render: the URL-sync effect below rewrites the query
  // string, and React's dev double-mount would otherwise re-read the rewritten one.
  const initialQuery = useRef(typeof window !== 'undefined' ? window.location.search : '');

  const go = useCallback((i: number) => setDeck({ slide: clampSlide(i), focus: null }), [setDeck]);

  // Initial state from the URL; amber field; lift the curtain.
  useEffect(() => {
    const params = new URLSearchParams(initialQuery.current);
    const s = Number(params.get('s'));
    const v = Number(params.get('v'));
    const patch: Parameters<typeof setDeck>[0] = {};
    if (Number.isInteger(s) && s >= 1 && s <= SLIDE_COUNT) patch.slide = s - 1;
    if (v === 1 || v === 2 || v === 3) patch.iteration = v;
    if (Object.keys(patch).length) setDeck(patch);
    setHue(CATEGORY_HUE.physics);
    const t = window.setTimeout(() => setCurtain(false), 120);
    return () => window.clearTimeout(t);
  }, [setDeck, setHue]);

  // Mirror slide → URL + page context (what the agent sees).
  useEffect(() => {
    const meta = SLIDES[slide];
    const url = new URL(window.location.href);
    url.searchParams.set('s', String(slide + 1));
    if (slide === ARCHITECTURE_SLIDE_INDEX) url.searchParams.set('v', String(iteration));
    else url.searchParams.delete('v');
    window.history.replaceState(null, '', url);
    setPage({
      kind: 'presentation',
      path: url.pathname,
      title: `${DECK.title} — ${DECK.event}`,
      slide: slide + 1,
      slideCount: SLIDE_COUNT,
      slideTitle: meta.title,
      archIteration: slide === ARCHITECTURE_SLIDE_INDEX ? iteration : undefined,
    });
    lastSlide.current = slide;
  }, [slide, iteration, setPage]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Keyboard: arrows / space / page keys, digits, N for notes, F for fullscreen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [data-agent-dock]')) return;
      const s = useAgentStore.getState();
      const cur = s.deck.slide;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
        case 'Enter':
          e.preventDefault();
          go(cur + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'Backspace':
          e.preventDefault();
          go(cur - 1);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(SLIDE_COUNT - 1);
          break;
        case 'n':
        case 'N':
          s.setDeck({ notesOpen: !s.deck.notesOpen });
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'v':
        case 'V':
          if (cur === ARCHITECTURE_SLIDE_INDEX) s.setDeck({ iteration: ((s.deck.iteration % 3) + 1) as 1 | 2 | 3, focus: null });
          break;
        default:
          if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, toggleFullscreen]);

  const meta = SLIDES[slide];
  const Current = COMPONENTS[meta.id];
  const elapsedTo = SLIDES.slice(0, slide).reduce((a, s) => a + s.minutes, 0);

  return (
    <div className={cn('deck fixed inset-0 flex flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]', dockOpen && 'sm:pr-[446px]')}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-4 sm:px-8 sm:pt-5">
        <p className="eyebrow">
          {DECK.title} <span className="text-muted-foreground/50">·</span> {DECK.event}
        </p>
        <p className="eyebrow hidden sm:block">
          {DECK.presenter} <span className="text-muted-foreground/50">·</span> {DECK.date}
        </p>
      </header>

      {/* Stage */}
      <div className="deck-stage relative min-h-0 flex-1 @container">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section
            key={meta.id}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            aria-label={`Slide ${slide + 1}: ${meta.title}`}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
          >
            {/* Centres short slides; tall ones (small windows) scroll instead of clipping. */}
            <div className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col justify-center px-5 py-4 sm:px-10">
              <Current />
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <footer className="no-print flex items-center gap-4 px-5 pb-4 pt-2 sm:px-8 sm:pb-5">
        <div className="flex flex-1 items-center gap-1.5" role="tablist" aria-label="Slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slide ${i + 1}: ${s.title}`}
              title={`${i + 1} · ${s.title}`}
              onClick={() => go(i)}
              className="group relative h-4 flex-1 cursor-pointer"
            >
              <span
                className={cn(
                  'absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-colors duration-500',
                  i < slide ? 'bg-glow/70' : i === slide ? 'bg-glow' : 'bg-foreground/12 group-hover:bg-foreground/30'
                )}
              />
            </button>
          ))}
        </div>
        <p className="hidden shrink-0 items-center gap-2 font-mono text-[0.7rem] text-muted-foreground sm:flex">
          <span className="text-foreground">{slide + 1}</span>
          <span>/ {SLIDE_COUNT}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{meta.title}</span>
          <span className="text-muted-foreground/50">·</span>
          <span title="Planned time reached at this slide">{elapsedTo} of {DECK.minutes} min</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Control label="Speaker notes (N)" active={notesOpen} onClick={() => setDeck({ notesOpen: !notesOpen })}>
            <NotebookPen className="size-3.5" />
          </Control>
          <Control label={fullscreen ? 'Exit full screen (F)' : 'Full screen (F)'} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Control>
          <Control label="Ask the deck agent (⌘K)" active={dockOpen} onClick={toggleDock}>
            <Sparkles className="size-3.5" />
          </Control>
          <span className="mx-1 h-5 w-px bg-border" />
          <Control label="Previous (←)" onClick={() => go(slide - 1)} disabled={slide === 0}>
            <ChevronLeft className="size-4" />
          </Control>
          <Control label="Next (→)" onClick={() => go(slide + 1)} disabled={slide === SLIDE_COUNT - 1}>
            <ChevronRight className="size-4" />
          </Control>
        </div>
      </footer>

      {/* Speaker notes */}
      <AnimatePresence>
        {notesOpen && (
          <motion.aside
            key="notes"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
            aria-label="Speaker notes"
            className="glass-strong absolute bottom-16 left-5 z-30 max-h-[46dvh] w-[min(520px,calc(100%-2.5rem))] overflow-y-auto rounded-2xl p-4 sm:left-8"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">
                Notes · {meta.title} · ~{meta.minutes} min
              </p>
              <button type="button" onClick={() => setDeck({ notesOpen: false })} className="kbd">
                N
              </button>
            </div>
            <ul className="flex flex-col gap-2 text-[0.85rem] leading-relaxed text-foreground/90">
              {meta.notes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-glow" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Entrance curtain */}
      <AnimatePresence>
        {curtain && (
          <motion.div
            key="curtain"
            aria-hidden
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: 'easeOut' } }}
            className="absolute inset-0 z-40 bg-ink"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Control({
  label,
  active,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-8 place-items-center rounded-full border transition-colors',
        active ? 'border-glow/50 bg-glow/15 text-foreground' : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
        disabled && 'pointer-events-none opacity-30',
        className
      )}
    >
      {children}
    </button>
  );
}
