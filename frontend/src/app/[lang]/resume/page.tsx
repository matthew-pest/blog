import type { Metadata } from 'next';
import { Download, Mail, MapPin, Globe } from 'lucide-react';
import { RESUME } from '@/lib/site/resume';
import AskButton from '@/components/site/AskButton';
import PrintButton from '@/components/site/PrintButton';

export const metadata: Metadata = {
  title: 'Résumé',
  description: `${RESUME.name} — ${RESUME.headline}.`,
};

export default function ResumePage() {
  const r = RESUME;
  return (
    <div className="mx-auto max-w-4xl px-5 pb-20">
      <header className="pt-10">
        <p className="eyebrow rise">Résumé · updated {r.updated}</p>
        <h1 className="display rise rise-1 mt-4 text-5xl sm:text-6xl">{r.name}</h1>
        <p className="rise rise-2 mt-3 text-lg text-muted-foreground">{r.headline}</p>
        <div className="rise rise-3 mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{r.location}</span>
          <a className="inline-flex items-center gap-1.5 hover:text-glow" href={`mailto:${r.email}`}><Mail className="size-3.5" />{r.email}</a>
          <a className="inline-flex items-center gap-1.5 hover:text-glow" href={r.website}><Globe className="size-3.5" />mattpest.com</a>
        </div>
        <div className="no-print rise rise-4 mt-7 flex flex-wrap gap-2">
          <AskButton prompt="Walk me through Matt's résumé. What stands out for a Principal AI Architect role?">Ask about this résumé</AskButton>
          <a
            href={r.pdfUrl}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-5 py-2.5 text-sm font-medium transition-colors hover:border-glow/50"
          >
            <Download className="size-4" /> PDF
          </a>
          <PrintButton />
        </div>
      </header>

      <section className="mt-12 rounded-3xl p-7 glass">
        <p className="text-[1.02rem] leading-relaxed">{r.summary}</p>
      </section>

      <Section title="Selected highlights">
        <ul className="grid gap-3 sm:grid-cols-2">
          {r.highlights.map((h) => (
            <li key={h.title} className="rounded-2xl border border-border/60 bg-background/30 p-4">
              <p className="font-medium">{h.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{h.detail}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Experience">
        <ol className="relative space-y-10 border-l hairline pl-6">
          {r.experience.map((e) => (
            <li key={`${e.org}-${e.start}`} className="relative">
              <span className="absolute -left-[1.85rem] top-1.5 size-2.5 rounded-full bg-glow ring-4 ring-background" />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-semibold tracking-tight">
                  {e.title} <span className="text-muted-foreground">· {e.org}</span>
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {e.start} – {e.end}
                </p>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
                {e.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {e.stack && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Utilized:</span> {e.stack.join(', ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Education">
        {r.education.map((ed) => (
          <div key={ed.school} className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">
              {ed.degree} <span className="text-muted-foreground">· {ed.school}</span>
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {ed.start} – {ed.end}
            </p>
            <p className="w-full text-sm text-muted-foreground">{ed.notes.join(' · ')}</p>
          </div>
        ))}
      </Section>

      <Section title="Skills">
        <div className="flex flex-wrap gap-2">
          {r.skills.map((s) => (
            <span key={s} className="rounded-full border border-border bg-background/30 px-3 py-1 text-xs">
              {s}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Interests">
        <p className="text-sm text-muted-foreground">{r.interests.join(' · ')}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="eyebrow mb-5">{title}</h2>
      {children}
    </section>
  );
}
