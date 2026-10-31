import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 博客内容集合:src/content/blog/ 下的每个 .md 文件就是一篇文章。
 * frontmatter 会用下面的 zod schema 校验,写错了构建时直接报错提醒你。
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    /** 标题 */
    title: z.string(),
    /** 摘要(列表卡片、SEO、RSS 用) */
    description: z.string(),
    /** 发布日期 */
    pubDate: z.coerce.date(),
    /** 最近修改(可选) */
    updatedDate: z.coerce.date().optional(),
    /** 板块:tech = 技术分享,essay = 杂谈随笔 */
    category: z.enum(['tech', 'essay']).default('tech'),
    /** 标签 */
    tags: z.array(z.string()).default([]),
    /** 草稿:true 时不会发布 */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
