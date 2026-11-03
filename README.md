# Ulysses Yang 的技术博客

基于 **Astro 5 + TypeScript + Tailwind CSS 4** 的个人技术博客。设计:白色打底 + 玫瑰红点缀、超大标题排版、跑马灯、等宽标签(排版骨架参考 codewebbarcelona.com),幕布动效每会话只播一次,可切深色主题。双端部署:GitHub Pages(公网)+ 家庭服务器(局域网镜像 + umami 统计)。

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
线上地址:**`https://ulyssesyang.top`**(自定义域名;旧地址 `ulysses-g-yang.github.io` 会 301 自动跳转)

### 家庭服务器(局域网镜像 + umami)

```bash
# 在服务器上(局域网 IP,按实际替换)
mkdir -p ~/blog && cd ~/blog
# 把 deploy/ 目录里的文件传上去(docker-compose.yml / nginx.conf / sync.sh)
cp deploy/.env.example .env && vim .env  # 填入强随机密码(切勿使用示例值)
docker compose up -d
```

之后容器会每 5 分钟自动从 GitHub 拉取最新代码并构建发布:

- 博客镜像:`http://<服务器局域网 IP>:8088/`
- umami 后台:`http://<服务器局域网 IP>:3001`(凭据在 deploy/.env 中配置;首次登录后请立即在后台修改默认密码,然后把统计脚本地址填到 `src/config.ts` 的 `UMAMI` 里重新推送即可接入)

## 踩坑记录(重要,改代码前先看)

1. **base 路径**:当前自定义域名部署在根路径(`base: '/'`);如迁回 `<用户名>.github.io` 项目站点,改回 `'/blog'` 并保持所有内部链接走 `withBase()`
2. **换页后元素引用会失效**:View Transitions 换页会替换 body,全局脚本里禁止缓存 DOM 引用(幕布除外,它有 `transition:persist`)
3. **`<html>` 属性换页会被覆盖**:主题初始化脚本必须带 `data-astro-rerun`
4. **中文 frontmatter**:值里含英文冒号要加引号,否则 YAML 解析报错
5. **中文字体**:用系统字体栈,别整包加载中文 webfont(好几 MB)
