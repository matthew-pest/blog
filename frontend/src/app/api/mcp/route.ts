import { createMcpHandler } from 'mcp-handler';
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { getPost, listPosts, searchPosts } from '@/lib/site/content';
import { PROJECTS } from '@/lib/site/projects';
import { RESUME, resumeToText } from '@/lib/site/resume';
import { baseUrl } from '@/lib/site/base-url';

/**
 * mattpest.com as an MCP server — with MCP Apps.
 *
 * Add `https://<site>/api/mcp` as a connector in Claude, ChatGPT, or VS Code
 * and the site's content becomes tools; `read_post` and `get_resume` carry a
 * `ui://` resource, so hosts that speak MCP Apps render the widget at
 * /mcp-app inline instead of a wall of text.
 */

const UI_VERSION = '2026-09-29-1';
const RESOURCE_URI = `ui://mattpest/app.html?v=${UI_VERSION}`;

// MCP Apps uses `ui.resourceUri` (and the compatibility `ui/resourceUri`
// key emitted by registerAppTool). ChatGPT's Apps SDK still discovers the
// same resource through its vendor-prefixed key, so advertise both rather
// than silently degrading to the text result in one family of hosts.
const APP_TOOL_META = {
  ui: { resourceUri: RESOURCE_URI },
  'openai/outputTemplate': RESOURCE_URI,
  'openai/widgetAccessible': true,
} as const;

async function widgetHtml(): Promise<string> {
  const origin = baseUrl();
  const res = await fetch(`${origin}/mcp-app`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Unable to render MCP App page (${res.status})`);

  const html = await res.text();

  // MCP hosts execute the resource in a locked-down document. Although the
  // resource CSP permits our origin, some hosts do not load Next's external
  // hydration chunks at all. That leaves the server-rendered browser fallback
  // visible (and explains the empty origin in that fallback). Make the app a
  // self-contained HTML resource by embedding its initial CSS and JS.
  const withStyles = await replaceAsync(html, /<link\b[^>]*>/gi, async (tag) => {
    if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href) return tag;
    return `<style>${await fetchAsset(origin, href)}</style>`;
  });

  const withScripts = await replaceAsync(
    withStyles,
    /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi,
    async (_tag, before, src, after) => {
      const attributes = `${before}${after}`.replace(/\s*(?:async|defer)(?:=["'][^"']*["'])?/gi, '');
      const script = (await fetchAsset(origin, src)).replace(/<\/script/gi, '<\\/script');
      return `<script${attributes}>${script}</script>`;
    }
  );

  // Any URLs loaded later by the Next runtime should resolve to this site,
  // rather than to the chat host's sandbox origin.
  return withScripts.replace(/<head>/i, `<head><base href="${origin}/">`);
}

async function fetchAsset(origin: string, path: string): Promise<string> {
  const response = await fetch(new URL(path, origin));
  if (!response.ok) throw new Error(`Unable to inline MCP App asset ${path} (${response.status})`);
  return response.text();
}

async function replaceAsync(
  value: string,
  pattern: RegExp,
  replacer: (match: string, ...groups: string[]) => Promise<string>
): Promise<string> {
  const matches = [...value.matchAll(pattern)];
  const replacements = await Promise.all(matches.map((match) => replacer(match[0], ...match.slice(1))));
  let index = 0;
  return value.replace(pattern, () => replacements[index++]);
}

const handler = createMcpHandler(
  (server) => {
    registerAppResource(
      server,
      'mattpest-widget',
      RESOURCE_URI,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => {
        const origin = baseUrl();
        return {
          contents: [
            {
              uri: RESOURCE_URI,
              mimeType: RESOURCE_MIME_TYPE,
              text: await widgetHtml(),
              _meta: {
                ui: {
                  csp: {
                    connectDomains: [origin],
                    resourceDomains: [origin, 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com'],
                  },
                },
                // Compatibility metadata for ChatGPT hosts that have not yet
                // switched resource policy discovery to the MCP Apps shape.
                'openai/widgetCSP': {
                  connect_domains: [origin],
                  resource_domains: [
                    origin,
                    'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com',
                  ],
                },
                'openai/widgetDomain': origin,
                'openai/widgetDescription': "Matt Pest's interactive site content",
              },
            },
          ],
        };
      }
    );

    server.registerTool(
      'search_posts',
      {
        title: 'Search blog posts',
        description: "Search Matt Pest's blog by topic; returns matching posts with excerpts and site paths.",
        inputSchema: z.object({ query: z.string().describe('Topic or keywords') }),
      },
      async ({ query }) => {
        const hits = await searchPosts(query, 5);
        const text = hits.length
          ? hits.map((h) => `• ${h.title} [${h.category}] — ${baseUrl()}${h.path}\n  ${h.excerpt}`).join('\n\n')
          : 'No matching posts.';
        return {
          content: [{ type: 'text', text }],
          structuredContent: { hits: hits.map(({ excerpt, ...h }) => ({ ...h, excerpt })) },
        };
      }
    );

    server.registerTool(
      'list_posts',
      {
        title: 'List blog posts',
        description: 'Every post on mattpest.com with title, category, date and description.',
        inputSchema: z.object({}),
      },
      async () => {
        const posts = await listPosts();
        return {
          content: [
            {
              type: 'text',
              text: posts.map((p) => `• ${p.title} [${p.category}] ${p.publishedAt.slice(0, 10)} — ${p.description}`).join('\n'),
            },
          ],
          structuredContent: { posts },
        };
      }
    );

    registerAppTool(
      server,
      'read_post',
      {
        title: 'Read a blog post',
        description: 'Read a post in full (markdown). Renders as an article card in hosts that support MCP Apps.',
        inputSchema: z.object({ slug: z.string().describe('Post slug from search_posts / list_posts') }),
        annotations: { readOnlyHint: true, openWorldHint: false },
        _meta: APP_TOOL_META,
      },
      async ({ slug }) => {
        const post = await getPost(slug);
        if (!post) return { content: [{ type: 'text', text: `No post with slug "${slug}".` }], isError: true };
        return {
          content: [{ type: 'text', text: `# ${post.title}\n\n${post.body}\n\n— ${baseUrl()}${post.path}` }],
          structuredContent: { kind: 'post', post: { ...post, url: `${baseUrl()}${post.path}` } },
        };
      }
    );

    registerAppTool(
      server,
      'get_resume',
      {
        title: "Matt Pest's résumé",
        description: 'Structured résumé: experience, highlights, skills, education, contact. Renders as a card in MCP Apps hosts.',
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true, openWorldHint: false },
        _meta: APP_TOOL_META,
      },
      async () => ({
        content: [{ type: 'text', text: resumeToText() }],
        structuredContent: { kind: 'resume', resume: RESUME },
      })
    );

    server.registerTool(
      'list_projects',
      {
        title: 'Featured projects',
        description: "Matt's projects (Telekinetik, Agentless, The Blox Office, Poster→Event, CEMC) with links.",
        inputSchema: z.object({}),
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: PROJECTS.map((p) => `• ${p.title} — ${p.tagline}${p.url ? ` (${p.url})` : ''}`).join('\n'),
          },
        ],
        structuredContent: { projects: PROJECTS },
      })
    );
  },
  {
    serverInfo: { name: 'mattpest.com', version: '1.0.0' },
    instructions:
      "Tools for reading Matt Pest's site: blog posts, résumé, projects. Prefer search_posts before read_post. read_post and get_resume render a UI widget in MCP Apps hosts.",
  }
);

export { handler as GET, handler as POST, handler as DELETE };
