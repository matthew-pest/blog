import Link from 'next/link';
import { ArrowRight, FileText, Globe, Image as ImageIcon, MousePointerClick, Plug, User } from 'lucide-react';
import { listPosts } from '@/lib/site/content';
import { PROJECTS } from '@/lib/site/projects';
import { getPageBySlug } from '@/app/[lang]/utils/get-page-by-slug';
import { getStrapiMedia } from '@/app/[lang]/utils/api-helpers';
import { baseUrl } from '@/lib/site/base-url';
import AskButton from '@/components/site/AskButton';
import ProjectCard from '@/components/site/ProjectCard';
import PostGrid from '@/components/site/PostGrid';
import CopyButton from '@/components/site/CopyButton';

export const revalidate = 300;

interface Testimonial {
  id: number;
  text: string;
  authorName: string;
  picture?: { data?: { attributes?: { url: string; alternativeText?: string } } };
}

async function getTestimonials(lang: string): Promise<Testimonial[]> {
  try {
    const page = await getPageBySlug('home', lang);
    const section = page?.data?.[0]?.attributes?.contentSections?.find(
      (s: any) => s.__component === 'sections.testimonials-group'
    );
    return section?.testimonials ?? [];
  } catch {
    return [];
  }
}

const CAPABILITIES = [
  { icon: FileText, title: 'Reads the blog', text: 'Searches and reads every post, then links the passage.' },
  { icon: User, title: 'Knows the résumé', text: 'Roles, results, stack — structured, not a PDF blob.' },
  { icon: Globe, title: 'Searches the web', text: 'Perplexity through Vercel AI Gateway, with sources.' },
  { icon: MousePointerClick, title: 'Moves the page', text: 'Navigates and highlights while it talks.' },
  { icon: ImageIcon, title: 'Poster → Event', text: 'Drop a flyer, get schema-validated JSON.' },
  { icon: Plug, title: 'Speaks MCP', text: 'The whole site is a connector for other agents.' },
];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [posts, testimonials] = await Promise.all([listPosts().catch(() => []), getTestimonials(lang)]);
  const mcpUrl = `${baseUrl()}/api/mcp`;

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero */}
      <section className="flex min-h-[78dvh] flex-col justify-center py-16">
        <p className="eyebrow rise">Matt Pest · Principal AI &amp; Data Architect · Chicago</p>
        <h1 className="display rise rise-1 mt-5 max-w-4xl text-5xl sm:text-7xl lg:text-[5.6rem]">
          A personal site{' '}
          <span className="inline bg-gradient-to-r from-foreground via-glow to-glow-2 bg-clip-text text-transparent">
            with an agent in it.
          </span>
        </h1>
        <p className="rise rise-2 mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Ask it anything about what I’ve written, what I’ve built, or where I’ve worked. It reads the posts, opens the
          résumé, searches the web when it needs to — and moves the page as it talks. The field behind you is a WebGPU
          shader listening to the conversation.
        </p>
        <div className="rise rise-3 mt-9 flex flex-wrap items-center gap-3">
          <AskButton prompt="Give me the tour: what can you do on this site?">Ask the site</AskButton>
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-5 py-2.5 text-sm font-medium transition-colors hover:border-glow/50"
          >
            Read the blog <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="rise rise-4 mt-10 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground/80">
          Next.js 16 · React 19 · AI SDK 7 · Claude via Vercel AI Gateway · vgpu WebGPU · MCP Apps
        </p>
      </section>

      {/* Capabilities */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <div key={c.title} className="rise flex items-start gap-3 rounded-2xl p-4 glass" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-glow/10 text-glow">
              <c.icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">{c.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Projects */}
      <section id="projects" className="scroll-mt-28 pt-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Projects</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Things I’m building.</h2>
          </div>
          <p className="hidden max-w-xs text-sm text-muted-foreground md:block">
            Hover a card and the field takes its colour. Ask about any of them.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      {/* Writing */}
      <section className="pt-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Writing</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Ideas, persisted.</h2>
          </div>
          <Link href={`/${lang}/blog`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-glow">
            All posts <ArrowRight className="size-4" />
          </Link>
        </div>
        <PostGrid posts={posts.slice(0, 6)} className="mt-8" />
      </section>

      {/* MCP */}
      <section className="pt-28">
        <div className="grid gap-8 rounded-3xl p-8 glass lg:grid-cols-[1.2fr_1fr] lg:p-12">
          <div>
            <p className="eyebrow">MCP Apps</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">Point your agent at this site.</h2>
            <p className="mt-4 text-muted-foreground">
              This site is also an MCP server. Add it as a connector in Claude, ChatGPT, or VS Code and the blog,
              résumé and projects become tools — and hosts that support MCP Apps render a live widget instead of a wall
              of text. Same functions the dock uses.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <code className="rounded-full border border-border bg-background/50 px-4 py-2 font-mono text-xs">{mcpUrl}</code>
              <CopyButton value={mcpUrl} label="Copy URL" />
              <a href="/mcp-app" className="text-xs text-muted-foreground hover:text-glow">
                Preview the widget →
              </a>
            </div>
          </div>
          <div className="grid content-center gap-2 font-mono text-xs text-muted-foreground">
            {['search_posts', 'read_post ⟶ ui://', 'get_resume ⟶ ui://', 'list_projects', 'list_posts'].map((t) => (
              <div key={t} className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="pt-28">
          <p className="eyebrow">Kind words</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {testimonials.map((t) => {
              const img = getStrapiMedia(t.picture?.data?.attributes?.url ?? null);
              return (
                <figure key={t.id} className="rounded-3xl p-6 glass">
                  <blockquote className="text-lg leading-relaxed">“{t.text}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="size-9 rounded-full object-cover" />
                    )}
                    {t.authorName}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="py-28 text-center">
        <h2 className="display text-4xl sm:text-5xl">Still curious?</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">The agent has read everything here. Ask it the question you actually have.</p>
        <div className="mt-8 flex justify-center">
          <AskButton>Ask the site</AskButton>
        </div>
      </section>
    </div>
  );
}
