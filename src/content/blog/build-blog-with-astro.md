---
title: 用 Astro 5 + TypeScript 从零搭建一个博客
description: 内容集合、双主题代码高亮、View Transitions、自动部署——把这套博客的骨架是怎么搭起来的完整记录下来。
pubDate: 2026-10-29
tags: [Astro, TypeScript, 教程]
---

这篇文章记录这套博客的骨架搭建过程。选 Astro 的理由很直接:**内容优先、默认零 JS、原生 TypeScript**,而且它的 View Transitions 让页面转场动画变得非常顺滑。

## 1. 初始化项目

```bash
npm create astro@latest my-blog -- --template minimal --typescript strict
cd my-blog
npx astro add tailwind
```

## 2. 用内容集合管理文章

Astro 5 的 Content Collections 让 Markdown 的 frontmatter 获得完整的类型校验。在 `src/content.config.ts` 里定义 schema:

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

从此以后,frontmatter 少写一个字段、日期格式写错,构建时都会直接报错——这对博客这种「内容即数据」的项目太重要了。

## 3. 列表页拿数据

```astro
---
import { getCollection } from 'astro:content';

// draft: true 的草稿不会发布
const posts = await getCollection('blog', ({ data }) => !data.draft);
---
{posts.map((post) => <a href={`/blog/${post.id}/`}>{post.data.title}</a>)}
```

`post.id` 默认就是文件名,所以 `hello-world.md` 会生成 `/blog/hello-world/`。

## 4. 双主题代码高亮

在 `astro.config.mjs` 里配置 Shiki 的双主题,亮暗两套配色一次性输出:

```javascript
export default defineConfig({
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'one-dark-pro',
      },
    },
  },
});
```

Shiki 会把暗色配色写进每个 span 的 `--shiki-dark` 变量,配合几行 CSS 就能在切换主题时零延迟变色:

```css
[data-theme='dark'] .astro-code,
[data-theme='dark'] .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

## 5. 搜索、评论、RSS

- **搜索**:pagefind 在构建后对 `dist` 建立纯前端索引,不需要任何服务端
- **评论**:giscus 复用仓库的 GitHub Discussions,数据在自己手里
- **RSS**:`@astrojs/rss` 一个 GET 端点搞定

## 6. 部署

GitHub Actions 监听 `main` 分支推送 → 构建 → 发布到 Pages。核心就是官方的 `withastro/action`:

```yaml
- uses: withastro/action@v3
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
```

## 踩坑记录

1. **base 路径**:GitHub Pages 项目站点部署在 `/blog/` 子路径,所有内部链接必须拼接 base,否则线上全 404。解决方式是统一封装 `withBase()` 函数
2. **换页后主题闪烁**:View Transitions 会用新页面的 `<html>` 覆盖当前属性,主题初始化脚本必须加 `data-astro-rerun` 让它每次换页重新执行
3. **中文字体**:完整的中文 webfont 动辄好几 MB,直接用系统字体栈反而最快最稳

## 总结

Astro 的「内容优先」哲学和博客场景完美匹配:页面默认零 JS、内容有类型校验、动效有官方转场方案。剩下的事,就只剩好好写文章了。
