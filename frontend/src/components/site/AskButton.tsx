'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/lib/agent-state';

/** Opens the dock, optionally with a prompt pre-filled. */
export default function AskButton({
  prompt,
  children,
  className,
  variant = 'primary',
}: {
  prompt?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'ghost';
}) {
  const setOpen = useAgentStore((s) => s.setDockOpen);
  const setDraft = useAgentStore((s) => s.setDraft);
  return (
    <button
      type="button"
      onClick={() => {
        if (prompt) setDraft(prompt);
        setOpen(true);
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:shadow-[0_0_0_6px_oklch(0.78_0.15_300_/_18%)]'
          : 'border border-border bg-background/40 hover:border-glow/50',
        className
      )}
    >
      <Sparkles className={cn('size-4', variant === 'ghost' && 'text-glow')} />
      {children}
    </button>
  );
}
