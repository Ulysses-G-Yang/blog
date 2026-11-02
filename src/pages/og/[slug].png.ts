import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// 每篇文章自动生成 OG 分享图(1200×630)。
// 依赖中文字体 .fonts/NotoSansSC.otf(CI 里由 workflow 缓存下载);
// 本地没有字体时,回退到站点默认分享图 public/og.png。

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const FONT_PATH = path.resolve('.fonts/NotoSansSC.otf');

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET({ props }: { props: { post: any } }) {
  const { post } = props;

  if (!fs.existsSync(FONT_PATH)) {
    const fallback = await sharp(path.resolve('public/og.png'))
      .png()
      .toBuffer();
    return new Response(new Uint8Array(fallback), {
      headers: { 'Content-Type': 'image/png' },
    });
  }

  const title: string = post.data.title;
  const date: string = post.data.pubDate.toLocaleDateString('zh-CN');
  const tags: string[] = post.data.tags ?? [];

  const fontData = fs.readFileSync(FONT_PATH);
  const satori = (await import('satori')).default;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(180deg, #ffffff 0%, #faf8fb 100%)',
          color: '#241a3a',
          fontFamily: 'Noto Sans SC',
          position: 'relative',
        },
        children: [
          // 顶部品牌条
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: '#c25d76',
              },
            },
          },
          // 眉头小字
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: '24px',
                letterSpacing: '0.2em',
                color: '#c25d76',
                marginBottom: '28px',
                fontFamily: 'Consolas, monospace',
              },
              children: '// BLOG — ULYSSES YANG',
            },
          },
          // 标题
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: title.length > 18 ? '58px' : '72px',
                fontWeight: 900,
                lineHeight: 1.25,
              },
              children: esc(title),
            },
          },
          // 日期 + 标签
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: '18px',
                marginTop: '40px',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '26px', color: '#6e6580' },
                    children: date,
                  },
                },
                ...tags.slice(0, 3).map((t: string) => ({
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      fontSize: '22px',
                      color: '#6e6580',
                      border: '1px solid #d9d3e0',
                      borderRadius: '999px',
                      padding: '6px 20px',
                      fontFamily: 'Consolas, monospace',
                    },
                    children: `# ${esc(t)}`,
                  },
                })),
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Noto Sans SC',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
}
