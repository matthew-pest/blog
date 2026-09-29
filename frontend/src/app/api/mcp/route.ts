import { createMcpHandler } from 'mcp-handler';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
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

const UI_VERSION = '2026-09-29-3';
const RESOURCE_URI = `ui://mattpest/app.html?v=${UI_VERSION}`;

// registerAppTool advertises the standard MCP Apps resource link from `ui`,
// including its flattened compatibility form. ChatGPT still discovers a
// component from the Apps SDK-specific outputTemplate key, however. Keep both
// on the descriptor: omitting either makes the same tool render as plain text
// in one of the two host families.
const APP_TOOL_META = {
  ui: { resourceUri: RESOURCE_URI },
  'openai/outputTemplate': RESOURCE_URI,
  'openai/widgetAccessible': true,
} as const;

let widgetHtmlPromise: Promise<string> | undefined;

async function widgetHtml(): Promise<string> {
  widgetHtmlPromise ??= buildWidgetHtml();
  return widgetHtmlPromise;
}

async function buildWidgetHtml(): Promise<string> {
  const sdkPath = path.join(
    process.cwd(),
    'node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js'
  );
  const sdk = await readFile(sdkPath, 'utf8');
  const appSymbol = sdk.match(/,([\w$]+) as App};?\s*$/)?.[1];
  if (!appSymbol) throw new Error('Unable to locate the App export in the MCP Apps browser bundle');
  const exposedSdk = sdk.replace(/\bexport\{/, `globalThis.__McpApp=${appSymbol};export{`).replace(/<\/script/gi, '<\\/script');

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;padding:8px;background:transparent;color:var(--color-text-primary,currentColor)}article{max-width:680px;padding:20px;border:1px solid var(--color-border-secondary,#7775);border-radius:16px;background:var(--color-background-primary,#fff1)}.eyebrow{margin:0 0 8px;text-transform:uppercase;letter-spacing:.08em;font-size:12px;opacity:.7}h1{margin:0 0 8px;font-size:24px;line-height:1.15}p{line-height:1.5}.muted{opacity:.72}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:18px 0}.card{padding:12px;border:1px solid var(--color-border-secondary,#7775);border-radius:12px}.card p{margin:4px 0 0;font-size:12px}.body{max-height:320px;overflow:auto}button{padding:9px 15px;border:0;border-radius:999px;background:var(--color-background-inverse,#111);color:var(--color-text-inverse,#fff);font:inherit;cursor:pointer}.status{padding:20px;opacity:.7}
</style></head><body><div id="root" class="status">Connecting to host…</div>
<script type="module">${exposedSdk}
const root=document.querySelector('#root');
const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const date=(value)=>new Date(value).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
let app;
function open(url){app.openLink({url})}
function render(payload){
  if(payload?.kind==='post'){
    const p=payload.post;
    const paragraphs=String(p.body??'').split(/\\n{2,}/).slice(0,6).map((text)=>'<p>'+esc(text.replace(/^#+\\s*/,''))+'</p>').join('');
    root.className='';root.innerHTML='<article><p class="eyebrow">'+esc(p.categoryName)+' · '+esc(date(p.publishedAt))+'</p><h1>'+esc(p.title)+'</h1><p class="muted">'+esc(p.description)+'</p><div class="body">'+paragraphs+'</div><button id="open">Read on mattpest.com →</button></article>';
    document.querySelector('#open').onclick=()=>open(p.url);return;
  }
  if(payload?.kind==='resume'){
    const r=payload.resume,current=r.experience?.[0]??{};
    const highlights=(r.highlights??[]).slice(0,4).map((h)=>'<div class="card"><strong>'+esc(h.title)+'</strong><p>'+esc(h.detail)+'</p></div>').join('');
    root.className='';root.innerHTML='<article><p class="eyebrow">Résumé · updated '+esc(r.updated)+'</p><h1>'+esc(r.name)+'</h1><p class="muted">'+esc(r.headline)+' · '+esc(r.location)+'</p><p>'+esc(r.summary)+'</p><div class="grid">'+highlights+'</div><p><strong>'+esc(current.title)+' · '+esc(current.org)+'</strong><br><span class="muted">'+esc(current.start)+' – '+esc(current.end)+'</span></p><button id="open">Full résumé →</button></article>';
    document.querySelector('#open').onclick=()=>open(r.website+'/en/resume');return;
  }
  root.textContent='The tool returned no displayable content.';
}
app=new globalThis.__McpApp({name:'mattpest.com',version:'1.0.0'},{});
app.ontoolresult=(result)=>render(result.structuredContent);
root.textContent='Waiting for the tool result…';
try{await app.connect()}catch(error){root.textContent='Unable to connect to the host: '+error.message}
</script></body></html>`;
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
