import { createMcpHandler } from 'mcp-handler';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { getPost, listPosts, searchPosts } from '@/lib/site/content';
import { PROJECTS } from '@/lib/site/projects';
import { RESUME, resumeToText } from '@/lib/site/resume';
import { baseUrl } from '@/lib/site/base-url';
import { WIDGET_TOOL_META, registerWidgetResources } from '@/lib/mcp/widget';

/**
 * mattpest.com as an MCP server — with MCP Apps.
 *
 * Add `https://<site>/api/mcp` as a connector in Claude, ChatGPT, or VS Code
 * and the site's content becomes tools; `read_post` and `get_resume` carry a
 * `ui://` resource (see `@/lib/mcp/widget`), so hosts that speak MCP Apps
 * render an article / résumé card inline instead of a wall of text.
 */

const handler = createMcpHandler(
  (server) => {
    registerWidgetResources(server, baseUrl);

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
        _meta: WIDGET_TOOL_META,
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
        _meta: WIDGET_TOOL_META,
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
