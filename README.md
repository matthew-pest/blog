# mattpest.com

Matt Pest's personal site — and a showcase for what a personal site can be when
there's an agent living in it.

- **The dock (⌘K)** answers from the blog, the résumé, the projects, and the live web,
  and moves the page as it talks: it navigates, scrolls, and highlights the passage
  it's citing.
- **The field** behind every page is a WebGPU shader (vgpu) that listens to the
  conversation — it breathes when idle, tightens when the agent thinks, ripples when it
  searches the web, and takes the colour of whatever it's reading.
- **Poster → Event**: drop a flyer in the chat and get schema-validated event JSON.
- **The site is an MCP server** (`/api/mcp`) with MCP Apps: add it as a connector in
  Claude, ChatGPT, or VS Code and `read_post` / `get_resume` render a live widget.

## Stack

| Layer | What |
|---|---|
| Frontend | Next.js 16 (Turbopack), React 19, Tailwind 4, shadcn/ui + AI Elements |
| Agent | AI SDK 7, Claude via Vercel AI Gateway (Sonnet 5 default, Opus 5 on demand), Perplexity search through the Gateway |
| Graphics | vgpu 0.4 — typed WGSL modules, `@vgpu/wgsl-std` simplex noise |
| MCP | `mcp-handler` 2 + `@modelcontextprotocol/ext-apps` (MCP Apps, `ui://` resources) |
| Content | Strapi 4 (`backend/`, on Render), media on S3 |
| Hosting | Vercel (frontend), Render (Strapi) |

## Layout

```
frontend/   the Next.js app — see frontend/README.md for the architecture
backend/    Strapi CMS (Node ≤ 20; content API only, the frontend reads it)
```

## Develop

```bash
yarn setup          # installs root, frontend and backend deps
yarn dev:frontend   # Next.js on :3000 (talks to the hosted Strapi)
yarn dev            # frontend + local Strapi (needs Node 20 for Strapi)
```

Copy `frontend/.env.example` to `frontend/.env.local` and set `AI_GATEWAY_API_KEY`
plus the Strapi token.

## Credits

Started from Strapi's [nextjs-corporate-starter](https://github.com/strapi/nextjs-corporate-starter);
almost none of it remains. MIT.
