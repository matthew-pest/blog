# mattpest.com — frontend

A personal site with an agent in it. Next.js 16 App Router, React 19, Tailwind 4.

```
src/
  app/
    [lang]/               locale-prefixed site (proxy.ts redirects to /en, /de, /cs)
      page.tsx            home: hero, capabilities, projects, latest posts, MCP, testimonials
      blog/               index, category, post (Strapi content)
      resume/             native résumé rendered from lib/site/resume.ts (print-ready)
      [...slug]/          any other Strapi page (legacy section components)
    api/chat/route.ts     the agent — AI SDK 7 + Vercel AI Gateway
    api/mcp/route.ts      the site as an MCP server, with MCP Apps (ui://) support
    mcp-app/              the widget MCP hosts render in a sandboxed iframe
  components/
    ambient/              vgpu WebGPU field — two shaders (grain.wgsl, contour.wgsl) over
                          field-common.wgsl; start-field.ts runs them, AmbientField.tsx mounts it
    agent/                ⌘K dock, message part renderers, page context, highlight
    site/                 nav, footer, cards, buttons
    ai-elements/, ui/     AI Elements + shadcn/ui (radix style)
  lib/
    agent-state.ts        zustand store shared by the agent, the field, and the pages
    ai/                   tools, system prompt, typed UIMessage contract, rate limit
    site/                 Strapi content access, résumé data, projects, base URL
```

## How the pieces talk

- **Agent → page.** Client tools `navigate` and `highlight` are fulfilled in the browser
  (`AgentDock.tsx` → `onToolCall`). `highlight` uses the CSS Custom Highlight API.
- **Page → agent.** `PageContextReporter` writes the current route, post, and text
  selection into the store; every chat request carries it as `context`.
- **Agent → field.** The route streams transient `data-status` parts (thinking,
  searching, reading, acting, hue, ripple). The dock writes them to the store; the
  shader reads the store every frame and glides toward the new state.
- **Site → other agents.** `/api/mcp` exposes `search_posts`, `read_post`,
  `get_resume`, `list_projects`, `list_posts`. `read_post` and `get_resume` carry a
  `ui://` resource (a self-contained HTML document from `lib/mcp/widget.ts`), so
  hosts that support MCP Apps (Claude, ChatGPT, VS Code) render a card inline.
  `yarn test:mcp-widget` drives that widget with the real ext-apps host bridge.

## Run it

```bash
yarn            # in this directory
cp .env.example .env.local   # fill in AI_GATEWAY_API_KEY and the Strapi token
yarn dev
```

WebGPU is required for the ambient field (Chrome/Edge/Safari 18+); everything else
degrades to a static gradient. Shaders are validated headlessly:

```bash
npx vgpu check src/components/ambient/grain.wgsl --require-validation
npx vgpu check src/components/ambient/contour.wgsl --require-validation
```

Visitors pick the shader with the toggle in the nav or footer (remembered in
`localStorage`), and the agent can switch it too via the `setBackground` tool.

## Models

`AGENT_MODEL_FAST` (default `anthropic/claude-sonnet-5`) serves normal turns;
`AGENT_MODEL_DEEP` (default `anthropic/claude-opus-5`) serves the *Deep* toggle.
The Gateway falls back through `AGENT_MODEL_*_FALLBACKS` when a model is unavailable.
Claude 5 requires paid credits on the AI Gateway account.
