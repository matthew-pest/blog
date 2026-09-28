import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAPI } from '@/app/[lang]/utils/fetch-api';
import Post from '@/app/[lang]/views/post';
import { listPosts } from '@/lib/site/content';

type PostParams = Promise<{ slug: string; category: string; lang: string }>;

async function getPostBySlug(slug: string) {
  const token = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  const urlParamsObject = {
    filters: { slug },
    populate: {
      cover: { fields: ['url'] },
      authorsBio: { populate: '*' },
      category: { fields: ['name', 'slug'] },
      seo: { populate: '*' },
      blocks: {
        populate: { __component: '*', files: '*', file: '*', url: '*', body: '*', title: '*', author: '*' },
      },
    },
  };
  return fetchAPI('/articles', urlParamsObject, { headers: { Authorization: `Bearer ${token}` } });
}

export async function generateMetadata({ params }: { params: PostParams }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPostBySlug(slug);
  const a = data.data?.[0]?.attributes;
  if (!a) return {};
  return {
    title: a.seo?.metaTitle ?? a.title,
    description: a.seo?.metaDescription ?? a.description,
    openGraph: { title: a.title, description: a.description, type: 'article', publishedTime: a.publishedAt },
  };
}

export default async function PostRoute({ params }: { params: PostParams }) {
  const { slug } = await params;
  const data = await getPostBySlug(slug);
  if (!data.data?.length) notFound();
  return <Post data={data.data[0]} />;
}

export async function generateStaticParams() {
  const posts = await listPosts().catch(() => []);
  return posts.map((p) => ({ slug: p.slug, category: p.category }));
}
