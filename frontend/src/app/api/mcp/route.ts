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
import { widgetHtml } from '@/lib/mcp/widget';

/**
 * mattpest.com as an MCP server — with MCP Apps.
 *
 * Add `https://<site>/api/mcp` as a connector in Claude, ChatGPT, or VS Code
 * and the site's content becomes tools; `read_post` and `get_resume` carry a
 * `ui://` resource, so hosts that speak MCP Apps render the widget at
 * /mcp-app inline instead of a wall of text.
 */

const UI_VERSION = '2026-09-29-4';
const RESOURCE_URI = `ui://mattpest/app.html?v=${UI_VERSION}`;
const OPENAI_RESOURCE_URI = `ui://mattpest/app-chatgpt.html?v=${UI_VERSION}`;
const OPENAI_RESOURCE_MIME_TYPE = 'text/html+skybridge';

// Claude and other MCP Apps hosts use the standard resource MIME type. ChatGPT
// currently fetches its outputTemplate as text/html+skybridge, so advertise a
// second URI backed by the exact same document instead of making either host
// guess how to interpret the other's content type.
const APP_TOOL_META = {
  ui: { resourceUri: RESOURCE_URI },
  'openai/outputTemplate': OPENAI_RESOURCE_URI,
} as const;

const handler = createMcpHandler(
  (server) => {
    const resource = (uri: string, mimeType: string) => {
      const origin = baseUrl();
      return {
        contents: [
          {
            uri,
            mimeType,
            text: widgetHtml(),
            _meta: {
              ui: {
                csp: {
                  connectDomains: [origin],
                  resourceDomains: [origin],
                },
              },
              'openai/widgetCSP': {
                connect_domains: [origin],
                resource_domains: [origin],
              },
              'openai/widgetDomain': origin,
              'openai/widgetDescription': "Matt Pest's interactive site content",
            },
          },
        ],
      };
    };

    registerAppResource(
      server,
      'mattpest-widget',
      RESOURCE_URI,
      { mimeType: RESOURCE_MIME_TYPE },
      async () => resource(RESOURCE_URI, RESOURCE_MIME_TYPE)
    );

    server.registerResource(
      'mattpest-widget-chatgpt',
      OPENAI_RESOURCE_URI,
      { mimeType: OPENAI_RESOURCE_MIME_TYPE },
      async () => resource(OPENAI_RESOURCE_URI, OPENAI_RESOURCE_MIME_TYPE)
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
