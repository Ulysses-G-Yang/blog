---
title: "帮朋友的清吧做官网，顺手造了座调酒风味图谱：Next.js 静态化、SVG 风味流与博客融合实战"
description: "朋友在成都开的清吧让我做个极简菜单页，做完之后把攒下的酒谱做成了零后端的调酒风味图谱：139 种食材、114 份酒谱、531 条共现关系，纯前端计算、静态导出 268 页。记录从 GitHub Pages 的 _next 404 排坑，到 96px 贝塞尔连线走廊与 Fuse.js 搜索分级排序的完整过程。"
pubDate: 2026-11-27
category: tech
tags: ["Next.js", "Astro", "前端工程", "可视化", "调酒"]
---

朋友在成都红星路开了间叫「奶油胡子（CREMA E BAFFI）」的小清吧，找我帮忙做一个极简菜单官网。做完官网之后，手里攒下了一堆酒单资料和风味笔记，干脆越折腾越上头——最后造出了一座包含 139 种食材、114 份酒谱、531 条共现关系的纯前端「调酒风味图谱」，还顺手用“杂志特种纸夹页”的形式，把酒吧官网和风味图谱一起融进了我的 Astro 个人博客。

<figure>
  <img src="/cocktail/crema-hero.png" alt="奶油胡子 Bar CREMA 官网首屏" />
  <figcaption>奶油胡子 Bar CREMA 官网首屏</figcaption>
</figure>

<figure>
  <img src="/cocktail/crema-signature.jpg" alt="奶油胡子招牌特调手稿卡片" />
  <figcaption>奶油胡子招牌特调手稿卡片</figcaption>
</figure>

这篇复盘记录整个过程里最值得分享的四个工程与设计节点。

## 一、零后端架构：把知识图谱压进一份静态 JSON

个人兴趣项目最怕维护成本失控——一旦上了数据库和后端 API，过半年忘了续费或升级依赖，站点就烂尾了。因此从第一天起定死红线：纯客户端计算 + Next.js 纯静态导出（output: 'export'），托管在 GitHub Pages，同时在家服留一份本地镜像。

整个数据流分三层，极其克制：

- 真源层：结构化维护 139 种食材、风味标签、家族聚合（如白/黑朗姆归入朗姆家族）与 114 份经典酒谱；
- 构建层：预处理脚本提前算好两层关系——实证共现（在真实经典酒谱中共同出现的频次）与分子共香建议（基于公开风味网络数据的芳香化合物重合度，附论文 DOI），打包成一份客户端 JSON；
- 渲染层：Next.js 静态导出为 268 个 HTML 页面，浏览器加载后所有组酒计算、筛选和模糊检索全在内存完成，零接口延迟。

## 二、一个经典的线上坑：为什么 _next/static 全部 404？

第一次推上 GitHub Pages 时遇到一个诡异现象：index.html、404.html 和 data/kb.json 全部 200，仓库里也实打实躺着 CSS 和 JS，但线上访问 _next/static/* 清一色 404，页面直接裸奔。

根因简单得让人哭笑不得：GitHub Pages 的分支部署默认走 Jekyll 构建，而 Jekyll 会自动丢弃所有以下划线 _ 开头的目录，导致 _next/ 被整包忽略。

彻底根治不要只手动补一次空文件，最好在构建链末尾串一个极简 postbuild 脚本，保证每次 next build 自动在 out/ 根目录重新生成 .nojekyll，防止覆盖部署时再弄丢：

```js
// scripts/postbuild-nojekyll.mjs
import { writeFileSync } from "node:fs";
writeFileSync("out/.nojekyll", "");
```

补上之后，线上 _next 静态资源瞬间全部恢复 200。

## 三、交互与视觉重构：从“死板列表”到三栏手稿风味流

静态资源修好后，初版组酒器的手感还是偏生硬：每次加料都走路由跳转重渲，搭配列表只是干巴巴的文字缩进，搜 gin 时甚至因为模糊匹配权重问题，把 ginger（姜汁啤酒/汽水）排到了金酒前面。

沿着「MANUSCRIPT 手稿印刷风」（暖纸底、墨线、朱红批注 #b3362d）的视觉基线，做了三处定向改造：

### 1. 内存状态 + 静默同步 URL

加料与撤料改为纯 React 内存状态即时重算，后台仅用 window.history.replaceState 静默更新 ?selected= 参数。既保留了复制链接直达某组配方的能力，又彻底干掉了点击闪烁。

### 2. 96px SVG 贝塞尔连线走廊 +「仅差 1 味即可解锁」

桌面端拆成「I. 已选原料 → II. 延伸搭配 → III. 命中酒谱」三栏，并在左中两栏之间留出 96px 专属连线区，按列距自适应控制点绘制标准三次贝塞尔曲线：

- 视觉分层与防缠绕：墨色实线表示经典酒谱实证共现，靛蓝色细虚线表示分子共香建议；悬停某张已选食材卡时，只高亮与它相关的连线，其余连线降至 opacity: 0.25，彻底解决多线交叉时的杂乱感；
- 更聪明的空态反馈：之前选了青柠汁、白朗姆和伏特加时，页面冷冰冰显示「命中 0 杯」——其实离大吉利只差糖浆、离自由古巴只差可乐。改造后由统一函数统计临门一脚的酒谱，底部常驻的 SHAKER 托盘动态提示「全齐 0 杯 · 差一味 9 杯」，右栏直接高亮这些酒谱，点击 + 缺料一键补齐。

<figure>
  <img src="/cocktail/flavor-flow-focus.jpg" alt="桌面端三栏手稿 SVG 风味流（悬停白朗姆酒高亮）" />
  <figcaption>桌面端三栏手稿 SVG 风味流（悬停白朗姆酒高亮）</figcaption>
</figure>

### 3. 搜索分级排序与三段式排版

将 Fuse.js 的 threshold 收紧到 0.25、提高 title 权重，并叠加三层排序规则：标题命中 > 别名整词命中（gin）> 别名词前缀（ginger），终于把金酒稳稳排回姜汁汽水前面。下拉项也重排为 [类型] 名称 + 简短风味标签 + 右侧家族聚合提示三段，彻底清掉半截省略号。

<figure>
  <img src="/cocktail/search-gin.jpg" alt="gin 搜索下拉框三段式排版" />
  <figcaption>gin 搜索下拉框三段式排版</figcaption>
</figure>

## 四、跨站融合：在极简白底博客里夹一页“特种纸手稿”

我的个人博客（ulyssesyang.top）用的是 Astro 5 现代极简白底，而酒吧和调酒站是暖纸手稿印刷风。把 Next.js 硬塞进 Astro 重写维护成本太高，直接放一条纯文字链接又太可惜。

最终的解法是策展式夹页（Inset）：在博客首页与 /projects 页中，用 1px 细墨线 + #faf8f5 微暖纸底做了一块「After Hours · 纸上微醺」双栏插页——左侧放奶油胡子黑白镂空眼睛线稿与「酸甜烈爽」四宫格直达酒吧官网；右侧放 01–04 编号的 2×2 风味切片胶囊（如 芒果 × 豆蔻、威士忌 × 黄油洗），点一下直接携带 ?selected= 参数跳进调酒站展开对应风味树；调酒站左上角再留一行 ← ULYSSES YANG / BLOG，两个独立部署的站点在体验上连成了一个完整的数字书房。

<figure>
  <img src="/cocktail/after-hours-inset.png" alt="博客「After Hours · 纸上微醺」特种纸插页" />
  <figcaption>博客「After Hours · 纸上微醺」特种纸插页</figcaption>
</figure>

## 写在最后

做个人项目最爽的时刻，不是堆了多少时髦框架，而是把生活里真实喜欢的东西——朋友的清吧、手边的酒谱、顺手的笔记——用干净克制的工程方式串成一件能长期运行的数字作品。

原文与线上体验入口：https://ulyssesyang.top/blog/cocktail-flavor-atlas-and-bar-site/  |  作者：Ulysses Yang（GitHub: Ulysses-G-Yang）  |  交流联系：yyue71172@gmail.com
