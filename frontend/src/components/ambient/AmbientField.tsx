'use client';

import { useEffect, useRef, useState } from 'react';
import { moodTargets, readStoredFieldVariant, useAgentStore } from '@/lib/agent-state';
import type { FieldHandle, FieldTargets } from './start-field';
import { highlightPassage } from '@/components/agent/highlight';

// Dev-only handle for driving the field/highlighter from the console or tests.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __agent?: unknown }).__agent = { store: useAgentStore, highlightPassage };
}

type Mode = 'probing' | 'webgpu' | 'fallback';

/**
 * Full-viewport WebGPU background that reacts to the agent and the visitor.
 *
 * Two shader variants (Slate Grain, Contour Field) share one runtime; the
 * visitor's choice lives in the store and localStorage. Falls back to a static
 * CSS gradient when WebGPU is missing, and renders single still frames when
 * the visitor prefers reduced motion.
 */
export default function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('probing');
  const [ready, setReady] = useState(false);
  const variant = useAgentStore((s) => s.fieldVariant);

  // Apply the visitor's remembered variant after hydration.
  useEffect(() => {
    const stored = readStoredFieldVariant();
    if (stored && stored !== useAgentStore.getState().fieldVariant) useAgentStore.setState({ fieldVariant: stored });
  }, []);

  // Pointer → store (throttled by rAF via the browser's own event cadence).
  useEffect(() => {
    const setPointer = useAgentStore.getState().setPointer;
    const onMove = (e: PointerEvent) => {
      setPointer(e.clientX / window.innerWidth, e.clientY / window.innerHeight, true);
    };
    const onLeave = () => {
      const [x, y] = useAgentStore.getState().pointer;
      setPointer(x, y, false);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const handleRef = useRef<FieldHandle | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      setMode('fallback');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    setMode('webgpu');

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getTargets = (): FieldTargets => {
      const s = useAgentStore.getState();
      const { energy, focus } = moodTargets(s.mood);
      const ripple = s.rippleAt == null ? -1 : (performance.now() - s.rippleAt) / 1000;
      return {
        variant: s.fieldVariant,
        energy,
        focus,
        hue: s.hue,
        pointer: s.pointer,
        pointerActive: s.pointerActive,
        ripple: ripple > 3 ? -1 : ripple,
        rippleOrigin: s.rippleOrigin,
        intensity: s.dockOpen ? 1.15 : 1,
      };
    };

    let cancelled = false;
    import('./start-field').then(({ startField }) => {
      if (cancelled) return;
      handleRef.current = startField(canvas, {
        getTargets,
        still,
        onReady: () => setReady(true),
      });
    });
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  // In still mode the loop isn't running, so redraw when the variant changes.
  useEffect(() => {
    handleRef.current?.refresh();
  }, [variant]);

  return (
    <div aria-hidden className="ambient-field" data-ready={ready} data-mode={mode} data-variant={variant}>
      {mode !== 'fallback' && <canvas ref={canvasRef} className="ambient-field__canvas" />}
      <div className="ambient-field__fallback" />
      <div className="ambient-field__scrim" />
    </div>
  );
}
