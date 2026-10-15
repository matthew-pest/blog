'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAgentStore } from '@/lib/agent-state';
import { DECK } from '@/lib/deck/hogbot';

const HOLD_MS = 2100;

/**
 * Full-screen transition played after the presentation unlocks. The deck lives
 * in a different root layout, so the hand-off is a full navigation; this
 * covers it so the move feels deliberate rather than like a page reload.
 */
export default function UnlockReveal() {
  const reveal = useAgentStore((s) => s.reveal);

  useEffect(() => {
    if (reveal !== 'presentation') return;
    const t = window.setTimeout(() => window.location.assign(DECK.path), HOLD_MS);
    return () => window.clearTimeout(t);
  }, [reveal]);

  return (
    <AnimatePresence>
      {reveal === 'presentation' && (
        <motion.div
          key="reveal"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-ink/92 backdrop-blur-xl"
        >
          {/* Expanding ring */}
          <motion.div
            aria-hidden
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute size-40 rounded-full border border-glow/70"
          />
          <motion.div
            aria-hidden
            initial={{ scale: 0.2, opacity: 0.6 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute size-40 rounded-full border border-glow-2/60"
          />
          <div className="relative flex flex-col items-center gap-4 text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="eyebrow"
            >
              Access granted
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.35, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
              className="display text-5xl sm:text-7xl"
            >
              {DECK.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="max-w-md text-sm text-muted-foreground"
            >
              {DECK.subtitle}
            </motion.p>
            <motion.div
              aria-hidden
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: (HOLD_MS - 600) / 1000, ease: 'linear' }}
              className="mt-2 h-px w-48 origin-left bg-glow"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
