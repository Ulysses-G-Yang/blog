import type { APIRoute } from 'astro';
import { SITE } from '../config';

// 明确欢迎各家搜索引擎与 AI 爬虫(SEO/GEO):
// 通配符本已允许,显式列出是为传递开放信号,也是 GEO 的标准做法
export const GET: APIRoute = () => {
  const origin = new URL(SITE.url).origin;
  const sitemap = new URL(
    `${import.meta.env.BASE_URL}sitemap-index.xml`,
    origin,
  );

  const aiBots = [
    'GPTBot', // OpenAI 训练爬虫
    'OAI-SearchBot', // ChatGPT 搜索
    'ChatGPT-User', // ChatGPT 用户实时浏览
    'ClaudeBot', // Anthropic
    'Claude-User', // Claude 用户实时浏览
    'PerplexityBot', // Perplexity
    'Google-Extended', // Gemini
    'Googlebot', // Google 搜索
    'Applebot', // Apple 智能与搜索
    'Bytespider', // 字节跳动(豆包)
    'bingbot', // 微软必应(Copilot)
    'Baiduspider', // 百度
  ];

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    ...aiBots.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${sitemap.href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
