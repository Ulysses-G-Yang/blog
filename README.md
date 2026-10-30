# Yangyue 的技术博客

基于 **Astro 5 + TypeScript + Tailwind CSS 4** 的个人技术博客。设计:白底黑字的极简排版,单一蓝色点缀,幕布转场动效(GTA5 官网式渐入),可切暗色。双端部署:GitHub Pages(公网)+ 家庭服务器(局域网镜像 + umami 统计)。

## 快速上手

```bash
npm install        # 安装依赖
npm run dev        # 开发模式(http://localhost:4321/blog)
npm run build      # 构建 + 生成搜索索引(输出到 dist/)
npm run preview    # 本地预览构建产物
```

## 怎么写新文章

在 `src/content/blog/` 下新建一个 `.md` 文件,文件名就是 URL(如 `my-post.md` → `/blog/my-post/`):

```markdown
---
title: 文章标题
description: 一句话摘要(列表卡片、RSS、SEO 都用它)
pubDate: 2026-10-30
tags: [Astro, 随笔]
draft: false        # true = 草稿,不会发布
---

正文用 Markdown 随便写……
```

frontmatter 字段在 `src/content.config.ts` 用 zod 校验,写错构建时会明确报错。**推送到 `main` 分支后约 2 分钟自动上线。**

## 常用配置(都在 `src/config.ts`)

| 配置 | 说明 |
| --- | --- |
| `SITE` | 站点名、作者、描述、GitHub、邮箱 |
| `GISCUS` | 评论系统:到 [giscus.app](https://giscus.app) 生成 4 个值填入即启用(仓库需公开 + 开启 Discussions) |
| `UMAMI` | 访问统计:家里服务器 umami 跑起来后填地址即启用 |
| `NAV` | 导航栏 |

## 站点结构

```
src/
├── config.ts              # 全局配置(改这里)
├── content.config.ts      # 文章 frontmatter 校验规则
├── content/blog/          # 文章(Markdown)
├── components/            # Header/Footer/幕布/搜索/评论/卡片等
├── layouts/BaseLayout.astro  # 布局 + 全站动效引擎(搜「幕布转场」)
├── pages/                 # 路由:首页/博客/标签/归档/关于/404/RSS
├── styles/global.css      # 设计 tokens + 双主题 + 排版
└── utils/posts.ts         # base 路径 / 排序 / 标签汇总等工具
deploy/                    # 家庭服务器部署(docker-compose + nginx + 同步脚本)
```

## 动效系统(缝合怪指南)

想换/删动效只动两个地方:

1. **幕布本体**:`src/components/Curtain.astro`(5 块帘片 + logo)
2. **时序控制**:`src/layouts/BaseLayout.astro` 全局脚本里搜「幕布转场」注释——落幕/揭幕的 GSAP 时间线都在这

页面里 `[data-hero]`(入场逐段渐入)和 `[data-reveal]`(滚动浮现)是动画钩子,加到任何元素即生效;整体删除不影响布局。所有动效尊重系统的「减弱动效」设置。

其他值得知道的机制:

- **主题切换无闪烁**:初始化脚本带 `data-astro-rerun`,换页不丢主题(踩坑点,别删)
- **换页不闪白**:Router 的 loader 被覆盖为「先落幕再加载」,带 1.2s 超时兜底,动画故障也不会卡住导航
- **代码双主题高亮**:Shiki 双主题 + `--shiki-dark` 变量,见 `global.css`

## 部署架构

### GitHub Pages(公网,自动)

推送到 `main` → Actions 构建(`.github/workflows/deploy.yml`)→ 发布 Pages。
线上地址:`https://ulysses-g-yang.github.io/blog/`

### 家庭服务器(局域网镜像 + umami)

```bash
# 在服务器上(192.168.1.33)
mkdir -p ~/blog && cd ~/blog
# 把 deploy/ 目录里的三个文件传上去(docker-compose.yml / nginx.conf / sync.sh)
docker compose up -d
```

之后容器会每 5 分钟自动从 GitHub 拉取最新代码并构建发布:

- 博客镜像:`http://192.168.1.33:8088/blog/`
- umami 后台:`http://192.168.1.33:3001`(默认 admin / umami,**记得改密码**;然后把统计脚本地址填到 `src/config.ts` 的 `UMAMI` 里重新推送即可接入)

## 踩坑记录(重要,改代码前先看)

1. **base 路径**:站点部署在 `/blog/` 子路径,所有内部链接必须走 `withBase()`(`src/utils/posts.ts`);换成 `<用户名>.github.io` 仓库时把 `astro.config.mjs` 的 `base` 改为 `'/'`
2. **换页后元素引用会失效**:View Transitions 换页会替换 body,全局脚本里禁止缓存 DOM 引用(幕布除外,它有 `transition:persist`)
3. **`<html>` 属性换页会被覆盖**:主题初始化脚本必须带 `data-astro-rerun`
4. **中文 frontmatter**:值里含英文冒号要加引号,否则 YAML 解析报错
5. **中文字体**:用系统字体栈,别整包加载中文 webfont(好几 MB)
