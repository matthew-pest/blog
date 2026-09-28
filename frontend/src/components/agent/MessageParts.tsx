'use client';

import Link from 'next/link';
import { ArrowUpRight, Compass, FileText, Globe, Highlighter, Ticket, User } from 'lucide-react';
import type { ChatStatus } from 'ai';
import { cn } from '@/lib/utils';
import type { AgentUIMessage } from '@/lib/ai/types';
import type { ExtractedEvent } from '@/lib/ai/tools';
import { MessageResponse } from '@/components/ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';

type Part = AgentUIMessage['parts'][number];

/** Renders one message's parts: text, reasoning, sources, and generative UI for each tool. */
export function MessageParts({
  message,
  lang,
  isLast,
  status,
}: {
  message: AgentUIMessage;
  lang: string;
  isLast: boolean;
  status: ChatStatus;
}) {
  const streaming = isLast && status === 'streaming';
  const sources = message.parts.filter((p) => p.type === 'source-url');

  return (
    <div className="flex flex-col gap-3">
      {message.parts.map((part, i) => (
        <PartView key={`${message.id}-${i}`} part={part} lang={lang} streaming={streaming} role={message.role} />
      ))}
      {sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          <SourcesContent>
            {sources.map((s, i) =>
              s.type === 'source-url' ? <Source key={i} href={s.url} title={s.title ?? s.url} /> : null
            )}
          </SourcesContent>
        </Sources>
      )}
    </div>
  );
}

function PartView({ part, lang, streaming, role }: { part: Part; lang: string; streaming: boolean; role: string }) {
  switch (part.type) {
    case 'text':
      return role === 'user' ? (
        <p className="whitespace-pre-wrap text-sm">{part.text}</p>
      ) : (
        <MessageResponse className="prose-site text-[0.925rem] leading-relaxed [&>*+*]:mt-3">{part.text}</MessageResponse>
      );

    case 'reasoning':
      return (
        <Reasoning isStreaming={streaming && part.state === 'streaming'} className="text-xs">
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      );

    case 'file':
      return part.mediaType.startsWith('image/') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={part.url} alt={part.filename ?? 'attachment'} className="max-h-56 rounded-xl border border-border object-cover" />
      ) : null;

    case 'tool-searchPosts':
      return (
        <ToolCard icon={<FileText className="size-3.5" />} label={`Searched the blog for “${part.input?.query ?? '…'}”`} state={part.state}>
          {part.state === 'output-available' && (
            <div className="grid gap-2">
              {part.output.hits.length === 0 && <p className="text-xs text-muted-foreground">No matching posts.</p>}
              {part.output.hits.map((h) => (
                <PostChip key={h.slug} href={h.path} title={h.title} meta={`${h.category} · ${h.publishedAt.slice(0, 10)}`} excerpt={h.excerpt} />
              ))}
            </div>
          )}
        </ToolCard>
      );

    case 'tool-readPost':
      return (
        <ToolCard icon={<FileText className="size-3.5" />} label="Read a post" state={part.state}>
          {part.state === 'output-available' && !('error' in part.output) && (
            <PostChip href={part.output.path} title={part.output.title} meta={`${part.output.categoryName} · ${part.output.publishedAt.slice(0, 10)}`} cover={part.output.coverUrl ?? undefined} />
          )}
        </ToolCard>
      );

    case 'tool-listPosts':
      return (
        <ToolCard icon={<FileText className="size-3.5" />} label="Listed every post" state={part.state}>
          {part.state === 'output-available' && (
            <p className="text-xs text-muted-foreground">{part.output.posts.length} posts</p>
          )}
        </ToolCard>
      );

    case 'tool-getResume':
      return (
        <ToolCard icon={<User className="size-3.5" />} label="Opened the résumé" state={part.state}>
          {part.state === 'output-available' && (
            <div className="rounded-xl border border-border/60 bg-background/40 p-3">
              <p className="text-sm font-medium">{part.output.resume.name}</p>
              <p className="text-xs text-muted-foreground">{part.output.resume.headline}</p>
              <Link href={`/${lang}/resume`} className="mt-2 inline-flex items-center gap-1 text-xs text-glow hover:underline">
                Full résumé <ArrowUpRight className="size-3" />
              </Link>
            </div>
          )}
        </ToolCard>
      );

    case 'tool-listProjects':
      return (
        <ToolCard icon={<Compass className="size-3.5" />} label="Looked up the projects" state={part.state}>
          {part.state === 'output-available' && (
            <div className="flex flex-wrap gap-1.5">
              {part.output.projects.map((p) => (
                <a key={p.slug} href={p.url ?? `/${lang}#projects`} target={p.url ? '_blank' : undefined} rel="noreferrer" className="rounded-full border border-border px-2.5 py-1 text-xs hover:border-glow/50">
                  {p.title}
                </a>
              ))}
            </div>
          )}
        </ToolCard>
      );

    case 'tool-webSearch':
      return (
        <ToolCard icon={<Globe className="size-3.5" />} label={`Searched the web${part.input && 'query' in part.input ? ` for “${Array.isArray(part.input.query) ? part.input.query.join(', ') : part.input.query}”` : ''}`} state={part.state}>
          {part.state === 'output-available' && 'results' in part.output && (
            <div className="grid gap-1.5">
              {part.output.results.slice(0, 5).map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="group rounded-lg border border-border/60 bg-background/40 px-3 py-2 hover:border-glow/50">
                  <p className="line-clamp-1 text-xs font-medium group-hover:text-glow">{r.title}</p>
                  <p className="line-clamp-2 text-[0.7rem] text-muted-foreground">{r.snippet}</p>
                </a>
              ))}
            </div>
          )}
          {part.state === 'output-available' && 'error' in part.output && (
            <p className="text-xs text-destructive">Search failed: {part.output.message}</p>
          )}
        </ToolCard>
      );

    case 'tool-extractEvent':
      return (
        <ToolCard icon={<Ticket className="size-3.5" />} label="Extracted the event" state={part.state} open>
          {part.state === 'output-available' && <EventCard event={part.output.event} />}
          {part.state === 'input-streaming' && part.input && <EventCard event={part.input as Partial<ExtractedEvent>} streaming />}
        </ToolCard>
      );

    case 'tool-navigate':
      return (
        <ActionChip icon={<Compass className="size-3.5" />} done={part.state === 'output-available'}>
          Opened <code className="font-mono text-[0.7rem]">{part.input?.path}</code>
        </ActionChip>
      );

    case 'tool-highlight':
      return (
        <ActionChip icon={<Highlighter className="size-3.5" />} done={part.state === 'output-available' && (part.output as { ok?: boolean })?.ok === true}>
          {part.state === 'output-available' && (part.output as { ok?: boolean })?.ok === false
            ? 'Couldn’t find that passage on this page'
            : `Highlighted “${(part.input?.text ?? '').slice(0, 60)}${(part.input?.text?.length ?? 0) > 60 ? '…' : ''}”`}
        </ActionChip>
      );

    case 'dynamic-tool':
      return (
        <Tool>
          <ToolHeader type={`tool-${part.toolName}`} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput output={part.output} errorText={part.errorText} />
          </ToolContent>
        </Tool>
      );

    default:
      return null;
  }
}

function ToolCard({
  icon,
  label,
  state,
  open,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  state: string;
  open?: boolean;
  children?: React.ReactNode;
}) {
  const pending = state === 'input-streaming' || state === 'input-available';
  const failed = state === 'output-error';
  return (
    <div className="rise rounded-xl border border-border/60 bg-background/30 p-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn('grid size-5 place-items-center rounded-full bg-glow/10 text-glow', pending && 'animate-pulse')}>{icon}</span>
        <span className={cn(failed && 'text-destructive')}>{failed ? `${label} — failed` : label}</span>
      </div>
      {children && (open || state === 'output-available' || state === 'input-streaming') && <div className="mt-2">{children}</div>}
    </div>
  );
}

function ActionChip({ icon, done, children }: { icon: React.ReactNode; done: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('rise inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs', done ? 'border-glow/40 bg-glow/10' : 'border-border text-muted-foreground')}>
      <span className="text-glow">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function PostChip({ href, title, meta, excerpt, cover }: { href: string; title: string; meta: string; excerpt?: string; cover?: string }) {
  return (
    <Link href={href} className="group flex gap-3 rounded-xl border border-border/60 bg-background/40 p-2.5 transition-colors hover:border-glow/50">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-medium group-hover:text-glow">{title}</p>
        <p className="text-[0.7rem] text-muted-foreground">{meta}</p>
        {excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{excerpt}</p>}
      </div>
    </Link>
  );
}

function EventCard({ event, streaming }: { event: Partial<ExtractedEvent>; streaming?: boolean }) {
  const price = event.price?.text ?? (event.price?.minCents != null ? `$${(event.price.minCents / 100).toFixed(0)}` : null);
  const rows: [string, React.ReactNode][] = [
    ['When', [event.date, event.startTime && `${event.startTime}${event.endTime ? `–${event.endTime}` : ''}`].filter(Boolean).join(' · ') || '—'],
    ['Where', [event.venue?.name, event.venue?.city].filter(Boolean).join(', ') || '—'],
    ['Lineup', event.lineup?.length ? event.lineup.join(' · ') : '—'],
    ['Price', price ?? '—'],
    ['Ages', event.ageRestriction ?? '—'],
  ];
  return (
    <div className={cn('overflow-hidden rounded-xl border border-glow/30 bg-background/50', streaming && 'animate-pulse')}>
      <div className="border-b hairline px-3 py-2.5">
        <p className="eyebrow">Event · {event.confidence != null ? `${Math.round(event.confidence * 100)}% confident` : 'reading…'}</p>
        <p className="mt-1 text-base font-semibold leading-tight">{event.name ?? '…'}</p>
        {event.description && <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-3 py-2.5 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {(event.links?.length || event.uncertain?.length) ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t hairline px-3 py-2">
          {event.links?.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] hover:border-glow/50">
              {l.label}
            </a>
          ))}
          {event.uncertain?.length ? (
            <span className="ml-auto text-[0.7rem] text-muted-foreground">unsure: {event.uncertain.join(', ')}</span>
          ) : null}
        </div>
      ) : null}
      <details className="border-t hairline px-3 py-2 text-[0.7rem] text-muted-foreground">
        <summary className="cursor-pointer">JSON</summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-background/60 p-2 font-mono text-[0.68rem] text-foreground">{JSON.stringify(event, null, 2)}</pre>
      </details>
    </div>
  );
}
