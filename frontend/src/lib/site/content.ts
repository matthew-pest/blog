import qs from 'qs';

/**
 * Read access to the site's own content (Strapi). Used by server components,
 * the agent's tools, and the MCP server — one implementation, three consumers.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  categoryName: string;
  coverUrl: string | null;
  path: string;
}

export interface PostFull extends PostSummary {
  /** Markdown of the whole post: rich-text blocks, quotes, media captions. */
  body: string;
  author: string | null;
}

async function strapi<T = any>(path: string, params: Record<string, unknown>, revalidate = 300): Promise<T> {
  const url = `${STRAPI_URL}/api${path}?${qs.stringify(params, { encodeValuesOnly: true })}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Strapi ${path} → ${res.status}`);
  return res.json();
}

export function postPath(category: string, slug: string, lang = 'en') {
  return `/${lang}/blog/${category}/${slug}`;
}

export interface Brand {
  navbarLogoUrl: string | null;
  navbarLogoText: string;
  footerLogoUrl: string | null;
  footerLogoText: string;
}

/**
 * The site's two animated GIF logos, hand-drawn and set on Strapi's global
 * singleton. Hardcoded as a fallback so the nav/footer never go bare if
 * Strapi is cold-starting or unreachable — these are the original assets,
 * S3 URLs are stable.
 */
const BRAND_FALLBACK: Brand = {
  navbarLogoUrl: 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com/header_logo_9db8af19c3.gif',
  navbarLogoText: "Hi I'm Matt",
  footerLogoUrl: 'https://elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com/footer_logo_b3ed876957.gif',
  footerLogoText: 'Matt Pest',
};

export async function getBrand(): Promise<Brand> {
  try {
    const json = await strapi(
      '/global',
      {
        locale: 'en',
        populate: {
          navbar: { populate: { navbarLogo: { populate: '*' } } },
          footer: { populate: { footerLogo: { populate: '*' } } },
        },
      },
      3600
    );
    const a = json.data?.attributes;
    const navbarLogo = a?.navbar?.navbarLogo;
    const footerLogo = a?.footer?.footerLogo;
    return {
      navbarLogoUrl: navbarLogo?.logoImg?.data?.attributes?.url ?? BRAND_FALLBACK.navbarLogoUrl,
      navbarLogoText: navbarLogo?.logoText ?? BRAND_FALLBACK.navbarLogoText,
      footerLogoUrl: footerLogo?.logoImg?.data?.attributes?.url ?? BRAND_FALLBACK.footerLogoUrl,
      footerLogoText: footerLogo?.logoText ?? BRAND_FALLBACK.footerLogoText,
    };
  } catch {
    return BRAND_FALLBACK;
  }
}

function toSummary(a: any): PostSummary {
  const at = a.attributes;
  const cat = at.category?.data?.attributes;
  return {
    slug: at.slug,
    title: at.title,
    description: at.description,
    publishedAt: at.publishedAt,
    category: cat?.slug ?? 'uncategorized',
    categoryName: cat?.name ?? 'Uncategorized',
    coverUrl: at.cover?.data?.attributes?.url ?? null,
    path: postPath(cat?.slug ?? 'uncategorized', at.slug),
  };
}

function blocksToMarkdown(blocks: any[] = []): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.__component) {
      case 'shared.rich-text':
        out.push(b.body ?? '');
        break;
      case 'shared.quote':
        out.push(`> ${b.body ?? ''}${b.author ? `\n> — ${b.author}` : ''}`);
        break;
      case 'shared.media':
        if (b.file?.data?.attributes?.caption) out.push(`*Image: ${b.file.data.attributes.caption}*`);
        break;
      case 'shared.video-embed':
        if (b.url) out.push(`*Video: ${b.url}*`);
        break;
      default:
        break;
    }
  }
  return out.join('\n\n').trim();
}

export async function listPosts(): Promise<PostSummary[]> {
  const json = await strapi('/articles', {
    locale: 'en',
    sort: { publishedAt: 'desc' },
    fields: ['title', 'slug', 'description', 'publishedAt'],
    populate: { category: { fields: ['slug', 'name'] }, cover: { fields: ['url'] } },
    pagination: { pageSize: 100 },
  });
  return (json.data ?? []).map(toSummary);
}

export async function getPost(slug: string): Promise<PostFull | null> {
  const json = await strapi('/articles', {
    locale: 'en',
    filters: { slug },
    populate: {
      category: { fields: ['slug', 'name'] },
      cover: { fields: ['url'] },
      authorsBio: { fields: ['name'] },
      blocks: { populate: '*' },
    },
  });
  const a = json.data?.[0];
  if (!a) return null;
  return {
    ...toSummary(a),
    body: blocksToMarkdown(a.attributes.blocks),
    author: a.attributes.authorsBio?.data?.attributes?.name ?? null,
  };
}

/** Every post with its body — cached for 10 minutes; the corpus is small. */
export async function getCorpus(): Promise<PostFull[]> {
  const json = await strapi(
    '/articles',
    {
      locale: 'en',
      sort: { publishedAt: 'desc' },
      populate: {
        category: { fields: ['slug', 'name'] },
        cover: { fields: ['url'] },
        authorsBio: { fields: ['name'] },
        blocks: { populate: '*' },
      },
      pagination: { pageSize: 100 },
    },
    600
  );
  return (json.data ?? []).map((a: any) => ({
    ...toSummary(a),
    body: blocksToMarkdown(a.attributes.blocks),
    author: a.attributes.authorsBio?.data?.attributes?.name ?? null,
  }));
}

export interface SearchHit extends PostSummary {
  score: number;
  /** Best-matching passage from the body. */
  excerpt: string;
}

/** Lightweight lexical search over the corpus (it's 11 posts, not 11 million). */
export async function searchPosts(query: string, limit = 5): Promise<SearchHit[]> {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9=+]+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return [];
  const corpus = await getCorpus();
  const hits: SearchHit[] = [];
  for (const post of corpus) {
    const title = post.title.toLowerCase();
    const desc = post.description.toLowerCase();
    const body = post.body.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (title.includes(t)) score += 6;
      if (desc.includes(t)) score += 3;
      const n = body.split(t).length - 1;
      score += Math.min(n, 8) * 0.6;
      if (post.category === t) score += 4;
    }
    if (score <= 0) continue;
    // Excerpt: the paragraph with the most term hits.
    const paras = post.body.split(/\n{2,}/);
    let best = paras[0] ?? post.description;
    let bestN = -1;
    for (const p of paras) {
      const pl = p.toLowerCase();
      const n = terms.reduce((acc, t) => acc + (pl.includes(t) ? 1 : 0), 0);
      if (n > bestN) {
        bestN = n;
        best = p;
      }
    }
    const { body: _body, author: _author, ...summary } = post;
    hits.push({ ...summary, score, excerpt: best.slice(0, 480) });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
