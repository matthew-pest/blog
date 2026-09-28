'use client';

import { ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_HUE, useAgentStore } from '@/lib/agent-state';
import type { Project } from '@/lib/site/projects';

const STATUS: Record<Project['status'], string> = { live: 'Live', building: 'Building', demo: 'Try it here' };

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const setHue = useAgentStore((s) => s.setHue);
  const setOpen = useAgentStore((s) => s.setDockOpen);
  const setDraft = useAgentStore((s) => s.setDraft);

  const ask = () => {
    if (project.ask) setDraft(project.ask);
    setOpen(true);
  };

  return (
    <article
      onPointerEnter={() => setHue(project.hue)}
      onPointerLeave={() => setHue(CATEGORY_HUE.default)}
      className={cn(
        'group relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-500 glass hover:-translate-y-0.5 hover:border-glow/40 rise',
        index === 0 && 'md:col-span-2'
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div>
        <div className="flex items-center justify-between">
          <p className="eyebrow">{STATUS[project.status]}</p>
          <span className="size-2 rounded-full" style={{ background: `oklch(0.78 0.15 ${project.hue * 360})` }} />
        </div>
        <h3 className="display mt-4 text-2xl">{project.title}</h3>
        <p className="mt-2 text-sm text-foreground/90">{project.tagline}</p>
        <p className="mt-3 text-sm text-muted-foreground">{project.description}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(project.links ?? (project.url ? [{ label: 'Visit', url: project.url }] : [])).map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-glow/60 hover:text-glow"
          >
            {l.label} <ArrowUpRight className="size-3" />
          </a>
        ))}
        {project.ask && (
          <button
            type="button"
            onClick={ask}
            className="inline-flex items-center gap-1.5 rounded-full bg-glow/10 px-3 py-1.5 text-xs text-glow transition-colors hover:bg-glow/20"
          >
            <Sparkles className="size-3" /> {project.status === 'demo' ? 'Try in chat' : 'Ask about it'}
          </button>
        )}
      </div>
    </article>
  );
}
