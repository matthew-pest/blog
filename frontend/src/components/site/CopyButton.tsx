'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-glow/50"
    >
      {done ? <Check className="size-3 text-glow" /> : <Copy className="size-3" />}
      {done ? 'Copied' : label}
    </button>
  );
}
