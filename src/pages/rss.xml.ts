import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import { sortPostsDesc } from '../utils/posts';

export const GET: APIRoute = async () => {
  const posts = sortPostsDesc(
    await getCollection('blog', ({ data }) => !data.draft),
  );
  const origin = new URL(SITE.url).origin;

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(import.meta.env.BASE_URL, origin),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: new URL(
        `${import.meta.env.BASE_URL}blog/${post.id}/`,
        origin,
      ).href,
    })),
    customData: '<language>zh-CN</language>',
  });
};
