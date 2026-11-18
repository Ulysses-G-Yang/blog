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

  const feedSelfUrl = new URL('feed.xml', new URL(import.meta.env.BASE_URL, origin)).href;

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
    customData: [
      '<language>zh-CN</language>',
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${feedSelfUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>`,
    ].join(''),
  });
};
