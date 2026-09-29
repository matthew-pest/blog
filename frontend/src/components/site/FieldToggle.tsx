'use client';

import { Mountain, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIELD_LABELS, FIELD_VARIANTS, useAgentStore, type FieldVariant } from '@/lib/agent-state';

const ICONS: Record<FieldVariant, typeof Sun> = { grain: Sun, contour: Mountain };

/**
 * Lets the visitor pick the ambient shader. `compact` is a single icon
 * button that cycles (for the nav); the default is a labelled segmented
 * control (for the footer). Both read and write the same store slot.
 */
export default function FieldToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const variant = useAgentStore((s) => s.fieldVariant);
  const setVariant = useAgentStore((s) => s.setFieldVariant);
  const cycle = useAgentStore((s) => s.cycleFieldVariant);

  if (compact) {
    const next = FIELD_VARIANTS[(FIELD_VARIANTS.indexOf(variant) + 1) % FIELD_VARIANTS.length];
    const Icon = ICONS[variant];
    return (
      <button
        type="button"
        onClick={cycle}
        title={`Background: ${FIELD_LABELS[variant]} — switch to ${FIELD_LABELS[next]}`}
        aria-label={`Background: ${FIELD_LABELS[variant]}. Switch to ${FIELD_LABELS[next]}`}
        className={cn(
          'grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground',
          className
        )}
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="eyebrow">Field</span>
      <div role="group" aria-label="Background style" className="inline-flex rounded-full border border-border bg-background/40 p-0.5">
        {FIELD_VARIANTS.map((v) => {
          const Icon = ICONS[v];
          const active = v === variant;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={active}
              onClick={() => setVariant(v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors',
                active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-3" />
              {FIELD_LABELS[v]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
