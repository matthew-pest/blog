import { tool } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import { getPost, listPosts, searchPosts } from '@/lib/site/content';
import { PROJECTS } from '@/lib/site/projects';
import { RESUME, resumeToText } from '@/lib/site/resume';

/**
 * The agent's tool surface. Server tools run here; client tools (no
 * `execute`) are fulfilled in the browser, where the page state lives.
 * The MCP server (app/api/mcp) exposes the same site functions to other hosts.
 */

/** Structured event extracted from a poster/flyer image. */
export const eventSchema = z.object({
  name: z.string().describe('Event title as printed'),
  date: z.string().nullable().describe('ISO 8601 date (YYYY-MM-DD) if determinable, else null'),
  startTime: z.string().nullable().describe('24h HH:MM local start time, or null'),
  endTime: z.string().nullable().describe('24h HH:MM local end time, or null'),
  venue: z.object({
    name: z.string().nullable(),
    address: z.string().nullable(),
    city: z.string().nullable(),
  }),
  lineup: z.array(z.string()).describe('Performers / speakers in billing order'),
  organizer: z.string().nullable(),
  price: z.object({
    text: z.string().nullable().describe('Price as printed, e.g. "$15 adv / $20 door"'),
    minCents: z.number().int().nullable(),
    maxCents: z.number().int().nullable(),
    currency: z.string().nullable(),
  }),
  ageRestriction: z.string().nullable().describe('e.g. "21+", "All ages"'),
  links: z.array(z.object({ label: z.string(), url: z.string() })),
  genres: z.array(z.string()),
  description: z.string().describe('One or two sentence summary for a listing'),
  confidence: z.number().min(0).max(1).describe('Overall confidence that fields are read correctly'),
  uncertain: z.array(z.string()).describe('Field names the poster left ambiguous'),
});

export type ExtractedEvent = z.infer<typeof eventSchema>;

export const agentTools = {
  searchPosts: tool({
    description:
      "Search Matt's blog posts by topic. Returns the best-matching posts with an excerpt. Use before answering anything about what Matt has written.",
    inputSchema: z.object({
      query: z.string().describe('Topic or keywords, e.g. "ER=EPR wormholes" or "headless CMS"'),
    }),
    execute: async ({ query }) => {
      const hits = await searchPosts(query, 5);
      return {
        query,
        hits: hits.map((h) => ({
          slug: h.slug,
          title: h.title,
          category: h.category,
          publishedAt: h.publishedAt,
          path: h.path,
          excerpt: h.excerpt,
        })),
      };
    },
  }),

  readPost: tool({
    description:
      'Read a blog post in full (markdown). Use when the visitor asks about a specific post or when you need details beyond the search excerpt.',
    inputSchema: z.object({ slug: z.string().describe('Post slug from searchPosts or the index') }),
    execute: async ({ slug }) => {
      const post = await getPost(slug);
      if (!post) return { error: `No post with slug "${slug}"` };
      return {
        slug: post.slug,
        title: post.title,
        category: post.category,
        categoryName: post.categoryName,
        publishedAt: post.publishedAt,
        author: post.author,
        path: post.path,
        coverUrl: post.coverUrl,
        body: post.body,
      };
    },
  }),

  listPosts: tool({
    description: 'List every blog post (title, category, date, one-line description).',
    inputSchema: z.object({}),
    execute: async () => ({ posts: await listPosts() }),
  }),

  getResume: tool({
    description:
      "Matt's full résumé as structured data plus a text rendering. Use for questions about experience, skills, roles, education, contact, or fit for a job.",
    inputSchema: z.object({}),
    execute: async () => ({ resume: RESUME, text: resumeToText() }),
  }),

  listProjects: tool({
    description: "Matt's featured projects (Telekinetik, Agentless, The Blox Office, Poster→Event, CEMC) with links.",
    inputSchema: z.object({}),
    execute: async () => ({ projects: PROJECTS }),
  }),

  extractEvent: tool({
    description:
      'Turn a poster or flyer image the visitor attached into structured event JSON. Fill every field you can read from the image; use null for unknowns and list ambiguous fields in `uncertain`. Call this once per poster.',
    inputSchema: eventSchema,
    execute: async (event) => ({ ok: true as const, event }),
  }),

  /** Web search executed by the AI Gateway (Perplexity) — works with any model. */
  webSearch: gateway.tools.perplexitySearch({ maxResults: 5 }),

  // ---- Client tools: no execute; the browser fulfils them. ----------------

  navigate: tool({
    description:
      "Navigate the visitor's browser to a page on this site. Use site paths only (e.g. /en/blog/physics/real-good-physics-the-brilliance-of-er-epr, /en/resume, /en/blog). Say why in one short sentence before or after.",
    inputSchema: z.object({ path: z.string().describe('Site path beginning with /') }),
    outputSchema: z.object({ ok: z.boolean(), path: z.string().optional() }),
  }),

  highlight: tool({
    description:
      'Scroll to and highlight an exact passage on the page the visitor is currently viewing. Quote the passage verbatim (8–40 words). Only works for text on the current page — navigate first if needed.',
    inputSchema: z.object({ text: z.string().describe('Verbatim passage to highlight') }),
    outputSchema: z.object({ ok: z.boolean(), reason: z.string().optional() }),
  }),
};

export type AgentToolSet = typeof agentTools;
