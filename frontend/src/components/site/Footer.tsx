import Image from 'next/image';
import Link from 'next/link';
import { RESUME } from '@/lib/site/resume';

export default function Footer({
  lang,
  logoUrl,
  logoText,
}: {
  lang: string;
  logoUrl: string | null;
  logoText: string;
}) {
  return (
    <footer className="no-print relative mt-24 border-t hairline">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt=""
                width={112}
                height={156}
                unoptimized
                className="h-12 w-auto rounded-lg"
              />
            )}
            <p className="eyebrow">{logoText}</p>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Principal AI &amp; data architect in Chicago. This site is open source and speaks MCP — point your agent at{' '}
            <code className="kbd">/api/mcp</code>.
          </p>
        </div>
        <div>
          <p className="eyebrow">Site</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-glow" href={`/${lang}/blog`}>Blog</Link></li>
            <li><Link className="hover:text-glow" href={`/${lang}#projects`}>Projects</Link></li>
            <li><Link className="hover:text-glow" href={`/${lang}/resume`}>Résumé</Link></li>
            <li><a className="hover:text-glow" href="/mcp-app">MCP App widget</a></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Elsewhere</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="hover:text-glow" href="https://github.com/matthew-pest" target="_blank" rel="noreferrer">GitHub</a></li>
            <li><a className="hover:text-glow" href="https://github.com/matthew-pest/blog" target="_blank" rel="noreferrer">Source of this site</a></li>
            <li><a className="hover:text-glow" href={`mailto:${RESUME.email}`}>{RESUME.email}</a></li>
            <li><a className="hover:text-glow" href="https://thebloxoffice.io/" target="_blank" rel="noreferrer">The Blox Office</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-10 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Matt Pest</span>
        <span className="font-mono">Next.js 16 · AI SDK 7 · Vercel AI Gateway · vgpu · MCP Apps · Strapi</span>
      </div>
    </footer>
  );
}
