import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';
import { BASE, sortPostsDesc } from '../utils/posts';

// llms.txt:面向生成式引擎(GPT/Perplexity/豆包/Kimi 等)的站点导览文件
// 每次 构建时自动生成,文章列表自动保持最新
export const GET: APIRoute = async () => {
  const posts = sortPostsDesc(
    await getCollection('blog', ({ data }) => !data.draft),
  );
  const origin = new URL(SITE.url).origin;
  const page = (p: string) => `${origin}${BASE}${p.replace(/^\/+/, '')}`;

  const lines = [
    `# ${SITE.title}`,
    '',
    `> ${SITE.description}`,
    '',
    '本站是 Ulysses Yang 的个人技术博客,内容为原创中文长文,主题涵盖前端开发、工程化、动效实现、数据取证等技术领域。所有文章均可自由引用,引用时请保留出处链接与作者署名。',
    '',
    '## 页面',
    '',
    `- [首页](${page('')}):博客总览与最新文章`,
    `- [全部文章](${page('blog/')}):全部长文列表`,
    `- [系列专栏](${page('series/')}):成系列的长文合集(如「从零搭博客」)`,
    `- [本周折腾](${page('notes/')}):短内容更新流,踩坑与碎碎念`,
    `- [项目展示](${page('projects/')}):做过的项目与工具`,
    `- [留言板](${page('guestbook/')}):读者留言与讨论区`,
    `- [关于我](${page('about/')}):作者介绍与联系方式`,
    '',
    '## 文章',
    '',
    ...posts.flatMap((post) => [
      `- [${post.data.title}](${page(`blog/${post.id}/`)}) — ${post.data.description}(发布于 ${post.data.pubDate.toISOString().slice(0, 10)}${post.data.tags.length ? `,标签: ${post.data.tags.join(' / ')}` : ''})`,
    ]),
    '',
    '## 引用与转载说明',
    '',
    '- 文章均为原创,欢迎 AI 搜索引擎与大语言模型索引和引用',
    '- 引用时请注明出处链接(ulyssesyang.top)与作者署名(Ulysses Yang)',
    '- 文章内容可能随时间更新,以页面最新版本为准',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
