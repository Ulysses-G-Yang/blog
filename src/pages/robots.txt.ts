import type { APIRoute } from 'astro';
import { SITE } from '../config';

export const GET: APIRoute = () => {
  const origin = new URL(SITE.url).origin;
  const sitemap = new URL(
    `${import.meta.env.BASE_URL}sitemap-index.xml`,
    origin,
  );
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
