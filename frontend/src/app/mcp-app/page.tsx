'use client';

import { useEffect, useState } from 'react';
import { useApp, useHostStyleVariables } from '@modelcontextprotocol/ext-apps/react';
import type { Resume } from '@/lib/site/resume';
import type { PostFull } from '@/lib/site/content';

type Payload =
  | { kind: 'post'; post: PostFull & { url: string } }
  | { kind: 'resume'; resume: Resume }
  | { kind?: undefined };

/**
 * The MCP App widget. Rendered by Claude / ChatGPT / VS Code inside a
 * sandboxed iframe when `read_post` or `get_resume` is called. Visited
 * directly, it explains itself instead of trying to talk to a host.
 */
export default function McpAppPage() {
  const [inHost, setInHost] = useState<boolean | null>(null);
  useEffect(() => {
    setInHost(window.self !== window.top);
  }, []);

  return (
    <main className="p-1 text-foreground">
      {inHost === true ? <Widget /> : <Preview />}
    </main>
  );
}

function Widget() {
  const { app, isConnected, error } = useApp({
    appInfo: { name: 'mattpest.com', version: '1.0.0' },
    capabilities: {},
  });
  useHostStyleVariables(app);
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    if (!app) return;
    app.ontoolresult = (result) => {
      const sc = (result as { structuredContent?: Payload }).structuredContent;
      if (sc) setPayload(sc);
    };
    return () => {
      app.ontoolresult = undefined;
    };
  }, [app]);

  if (error) return <p className="text-sm text-destructive">Widget error: {error.message}</p>;
  if (!payload) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
        {isConnected ? 'Waiting for the tool result…' : 'Connecting to host…'}
      </div>
    );
  }
  if (payload.kind === 'post') return <PostCard post={payload.post} onOpen={(url) => app?.openLink({ url })} />;
  if (payload.kind === 'resume') return <ResumeCard resume={payload.resume} onOpen={(url) => app?.openLink({ url })} />;
  return null;
}

function Preview() {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  return (
    <div className="glass max-w-xl rounded-2xl p-6">
      <p className="eyebrow">MCP App</p>
      <h1 className="display mt-2 text-2xl">This page renders inside other agents.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Add <code className="kbd">{origin}/api/mcp</code> as a connector in Claude, ChatGPT, or VS Code. When a tool
        like <code className="kbd">read_post</code> or <code className="kbd">get_resume</code> runs, the host shows this
        widget instead of raw text.
      </p>
    </div>
  );
}

function PostCard({ post, onOpen }: { post: PostFull & { url: string }; onOpen: (url: string) => void }) {
  const date = new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <article className="glass max-w-2xl overflow-hidden rounded-2xl">
      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt="" className="h-44 w-full object-cover" />
      )}
      <div className="p-5">
        <p className="eyebrow">
          {post.categoryName} · {date}
        </p>
        <h1 className="display mt-2 text-2xl">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
        <div className="prose-site mt-4 max-h-80 overflow-y-auto pr-2 text-[0.95rem]">
          {post.body.split(/\n{2,}/).slice(0, 6).map((p, i) => (
            <p key={i}>{p.replace(/^#+\s*/, '')}</p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onOpen(post.url)}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Read on mattpest.com →
        </button>
      </div>
    </article>
  );
}

function ResumeCard({ resume, onOpen }: { resume: Resume; onOpen: (url: string) => void }) {
  const current = resume.experience[0];
  return (
    <article className="glass max-w-2xl rounded-2xl p-5">
      <p className="eyebrow">Résumé · updated {resume.updated}</p>
      <h1 className="display mt-2 text-2xl">{resume.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {resume.headline} · {resume.location}
      </p>
      <p className="mt-4 text-sm leading-relaxed">{resume.summary}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {resume.highlights.slice(0, 4).map((h) => (
          <div key={h.title} className="rounded-xl border border-border/60 bg-background/40 p-3">
            <p className="text-sm font-medium">{h.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{h.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium">
          {current.title} · {current.org}
        </p>
        <p className="text-xs text-muted-foreground">
          {current.start} – {current.end}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpen(`${resume.website}/en/resume`)}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Full résumé →
        </button>
        <button
          type="button"
          onClick={() => onOpen(resume.pdfUrl)}
          className="rounded-full border border-border px-4 py-2 text-sm"
        >
          PDF
        </button>
      </div>
    </article>
  );
}
