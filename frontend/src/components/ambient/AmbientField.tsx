'use client';

import { useEffect, useRef, useState } from 'react';
import { moodTargets, useAgentStore } from '@/lib/agent-state';
import type { FieldTargets } from './start-field';
import { highlightPassage } from '@/components/agent/highlight';

// Dev-only handle for driving the field/highlighter from the console or tests.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __agent?: unknown }).__agent = { store: useAgentStore, highlightPassage };
}

type Mode = 'probing' | 'webgpu' | 'fallback';

/**
 * Full-viewport WebGPU background that reacts to the agent and the visitor.
 *
 * Falls back to a static CSS gradient when WebGPU is missing, and renders a
 * single still frame when the visitor prefers reduced motion.
 */
export default function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>('probing');
  const [ready, setReady] = useState(false);

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

    let dispose: (() => void) | undefined;
    let cancelled = false;
    import('./start-field').then(({ startField }) => {
      if (cancelled) return;
      dispose = startField(canvas, {
        getTargets,
        still,
        onReady: () => setReady(true),
      });
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div aria-hidden className="ambient-field" data-ready={ready} data-mode={mode}>
      {mode !== 'fallback' && <canvas ref={canvasRef} className="ambient-field__canvas" />}
      <div className="ambient-field__fallback" />
      <div className="ambient-field__scrim" />
    </div>
  );
}
