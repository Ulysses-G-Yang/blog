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
    /** 系列专栏(可选,同名归为一个系列) */
    series: z.string().optional(),
    /** 系列内的序号(可选) */
    seriesOrder: z.number().optional(),
    /** 标签 */
    tags: z.array(z.string()).default([]),
    /** 草稿:true 时不会发布 */
    draft: z.boolean().default(false),
  }),
});

/** 「本周折腾」短内容:微博式小记,一段话一篇,降低更新门槛 */
const notes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/notes' }),
  schema: z.object({
    pubDate: z.coerce.date(),
    /** 心情/标签小字(可选) */
    mood: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, notes };
