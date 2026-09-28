import { formatDate, getStrapiMedia } from '@/app/[lang]/utils/api-helpers';
import { postRenderer } from '@/app/[lang]/utils/post-renderer';

interface Article {
  id: number;
  attributes: {
    title: string;
    description: string;
    slug: string;
    cover: { data: { attributes: { url: string } } | null };
    category: { data: { attributes: { name: string; slug: string } } | null };
    authorsBio: {
      data: { attributes: { name: string; avatar: { data: { attributes: { url: string } } | null } } } | null;
    };
    blocks: any[];
    publishedAt: string;
  };
}

export default function Post({ data }: { data: Article }) {
  const { title, description, publishedAt, cover, authorsBio, category } = data.attributes;
  const author = authorsBio.data?.attributes;
  const imageUrl = getStrapiMedia(cover.data?.attributes.url ?? null);
  const authorImgUrl = getStrapiMedia(author?.avatar?.data?.attributes.url ?? null);

  return (
    <article className="pt-10">
      <p className="eyebrow rise">
        {category.data?.attributes.name ?? 'Post'} · {formatDate(publishedAt)}
      </p>
      <h1 className="display rise rise-1 mt-4 text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
      <p className="rise rise-2 mt-5 text-lg text-muted-foreground">{description}</p>
      <div className="rise rise-3 mt-6 flex items-center gap-3 text-sm text-muted-foreground">
        {authorImgUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={authorImgUrl} alt="" className="size-8 rounded-full object-cover" />
        )}
        <span>{author?.name ?? 'Matt'}</span>
      </div>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="rise rise-4 mt-10 aspect-[21/9] w-full rounded-3xl object-cover" />
      )}
      <div className="prose-site mt-10 max-w-none">
        {data.attributes.blocks.map((section: any, index: number) => postRenderer(section, index))}
      </div>
    </article>
  );
}
