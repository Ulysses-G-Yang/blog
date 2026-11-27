---
title: "帮朋友的清吧做官网，顺手造了座调酒风味图谱：Next.js 静态导出、三栏 SVG 贝塞尔与 Astro 跨站融合"
description: "朋友在成都开的清吧让我做个极简菜单页，做完之后把攒下的酒谱做成了零后端的调酒风味图谱：139 种食材、114 份酒谱、531 条共现关系，纯前端计算、静态导出 268 页。记录从 GitHub Pages 的 _next 404 排坑，到 96px 贝塞尔连线走廊与 Fuse.js 搜索分级排序的完整过程。"
pubDate: 2026-11-27
category: tech
tags: ["Next.js", "Astro", "前端工程", "可视化", "调酒"]
---

<figure>
  <img src="/cocktail/crema-hero.png" alt="奶油胡子 Bar CREMA 官网首屏" />
  <figcaption>奶油胡子 CREMA E BAFFI BAR：暖纸底 + 墨线 + 朱红批注的手稿视觉基线</figcaption>
</figure>

帮朋友在成都红星路开的清吧（CREMA E BAFFI · 奶油胡子）做完极简官网之后，手里攒下了一堆酒单资料和风味笔记。原本只是想在静态网页里加一个食材检索，结果越做越上头，最后演变成一座包含 **139 种食材、114 份酒谱、531 条共现关系**的纯前端「调酒风味图谱」，并且把它和酒吧官网一起，用「杂志特种纸夹页」的形式嵌进了我的 Astro 个人博客。

这篇记录三个真正花时间的部分：怎么做成零后端、怎么被 GitHub Pages 的 `_next` 404 阴了一把、以及三栏组酒交互和搜索排序是怎么收敛到能用状态的。

## 一、零后端：把知识图谱压进一份静态 JSON

个人兴趣项目最怕维护成本失控——一旦上了数据库和 API，过半年忘了续费或者依赖升不上去，站点就废了。所以从第一天就定死红线：**纯客户端计算 + 纯静态导出**（`output: 'export'`），托管在 GitHub Pages，家里服务器留一份本地镜像。

数据分三层处理：

- **真源层**：食材、风味标签、家族归属（白朗姆、黑朗姆统一归入「朗姆」家族）、经典酒谱全部用结构化文本维护在 `vault/` 目录里，写配方就是在写笔记。
- **构建层**：`scripts/gen-bundle.mjs` 在 `prebuild` 阶段跑一遍，算出两层关系——**实证共现**（在真实经典酒谱里共同出现的次数）与**分子共香**（基于公开风味网络数据的芳香化合物重合度，附 DOI 来源），打包成一份 `web/public/data/kb.json`。
- **渲染层**：Next.js 静态导出 **268 个 HTML 页面**，浏览器加载后所有组酒计算和搜索都在内存里完成，零接口延迟。

实际体积并不大：531 条共现、114 份酒谱加起来的 JSON 只有几百 KB，比一张压缩后的开屏海报还轻。真正撑起「图谱感」的不是数据量，而是关系被显式表达出来了。

<figure>
  <img src="/cocktail/crema-signature.jpg" alt="奶油胡子招牌特调酒单，每杯一张手稿卡片" />
  <figcaption>招牌特调的手稿卡片：酸、甜、烈、爽四格量表就是风味图谱的最小单元</figcaption>
</figure>

## 二、为什么 `_next/static` 全部 404

站点第一次推上 GitHub Pages 时出现了一个很诡异的现象：`index.html`、`404.html`、`data/kb.json` 全部返回 200，仓库里也实打实躺着 `_next/static/css/*.css` 和 `webpack-*.js`，但线上访问这些静态资源却清一色 404，页面裸奔无样式。

根因简单得让人哭笑不得：**GitHub Pages 的分支部署默认会经过 Jekyll 构建，而 Jekyll 会忽略所有以下划线开头的目录**，于是 Next.js 生成的 `_next/` 被整包丢弃。

彻底的修法需要两步，缺一不可：

1. 在站点仓库根目录补一个 0 字节空文件 `.nojekyll`；
2. 在构建链末尾串一个 postbuild 脚本，保证每次重新导出都不会把它弄丢。

```js
// scripts/postbuild-nojekyll.mjs
import { writeFileSync } from "node:fs";
writeFileSync("out/.nojekyll", "");
```

```json
// package.json
"build": "cross-env STATIC_EXPORT=1 next build && node scripts/postbuild-nojekyll.mjs"
```

验证方法很土但有效：构建完 `Test-Path web/out/.nojekyll`，推送后再对线上某个 `_next/static/css/*.css` 直接 `Invoke-WebRequest`，拿到 200 才算真的解决。只验首页是没用的，首页永远 200。

## 三、三栏手稿风味流：96px 走廊与标准三次贝塞尔

沿着「MANUSCRIPT 手稿印刷风」的视觉基线（暖纸底、1px 墨线、朱红批注 `#b3362d`），交互层做了三处定向改造。

**内存状态 + 静默同步 URL。** 加料时不再走 `router.replace` 触发整页重渲，改为纯 React 内存状态即时重算，后台只用 `window.history.replaceState` 悄悄更新 `?selected=` 参数。分享链接的能力保留了，点击闪烁彻底消失了。

**三栏布局 + 96px 贝塞尔走廊。** 桌面端拆成「I. 已选原料 → II. 延伸搭配 → III. 命中酒谱」，左中两栏之间留出一条专属连线区：

```ts
// grid: 220px 卡列 | 72px 走廊 | 自适应中栏 | 320px 右栏
lg:grid-cols-[220px_72px_minmax(0,1fr)_320px] lg:gap-x-0
// 中栏再加 24px 内距，72 + 24 = 96px 实际弧线空间
```

曲线用标准三次贝塞尔表达风味流向，控制点按列距自适应，而不是固定常量：

```ts
const dx = Math.min(64, Math.max(24, (x2 - x1) * 0.55));
const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
```

早期版本所有连线都挤成一束竖线，原因是 SVG 画布只有二十来像素宽，控制点又写在卡片边缘——弧线根本没地方弯。加宽走廊之后，多条线才会自然分叉成扇形。

**悬停高亮。** 鼠标进入或聚焦某张已选卡片时，只有它的连线保持不透明，其余降到 `opacity: 0.25`，配 `transition: stroke-opacity 150ms`。实证共现用墨色实线，分子共香用靛蓝细虚线并挂 DOI 角标。

<figure>
  <img src="/cocktail/flavor-flow-focus.jpg" alt="桌面端三栏风味流，悬停白朗姆酒时连线高亮" />
  <figcaption>悬停「白朗姆酒」：该卡描红，四条关联弧线高亮，其余连线淡出到 0.25</figcaption>
</figure>

**「差一味」的文案反馈。** 右栏支持「仅差 1 味即可解锁」，底部常驻 SHAKER 托盘。这里踩过一个真实的一致性 bug：顶栏显示「差一味 6 杯」而托盘显示 9 杯，因为顶栏误用了被 `slice(0, 6)` 截断后的数组长度。修法是抽一个 `countNearMiss(bundle, selected)` 出来，两处调同一个函数——**同一个数字永远不要在两处各算一遍**。

顺带一个 React 的坑：`useMemo` 不能写在 `if (!kb) return` 之后，骨架屏的早退分支会让 hooks 顺序错乱，构建期不报错，运行时直接白屏。

另一个隐蔽问题是测量连线的 `useEffect`：依赖数组里塞了每次渲染都会新建的数组引用，导致无限重渲染；最后改成 `dataRef` + 签名比对，依赖置空才稳定下来。

## 四、搜索：为什么搜 `gin` 先出姜汁啤酒

默认的 Fuse.js 配置下，搜 `gin` 会把 `ginger`（姜汁啤酒、姜汁汽水）排到「金酒」前面。原因很直白：模糊匹配里 `ginger` 与 `gin` 的编辑距离更近，而中文名「金酒」对它来说只是一串陌生字符。

三层修正：

```ts
new Fuse(docs, {
  threshold: 0.25,            // 从 0.4 收紧，减少无关命中
  includeScore: true,
  keys: [
    { name: "title", weight: 0.6 },
    { name: "aliases", weight: 0.3 },
    { name: "tags", weight: 0.1 },
  ],
});
```

再叠一层分级排序，把「英文别名整词命中」当成强信号：

```ts
function tierOf(doc, needle) {
  if (doc.title === needle || doc.title.startsWith(needle)) return 0;
  if (doc.tokens?.includes(needle)) return 0.4;        // gin 是金酒的别名整词
  if (doc.title.includes(needle)) return 0.6;
  if (doc.tokens?.some((t) => t.startsWith(needle))) return 1.4; // ginger
  return 2;
}
const rank = (d) => tierOf(d.item, needle) * 10 + d.score;
```

结果是搜 `gin` 的顺序变成「老汤姆金酒 → 金菲士 → 金酒 → 姜汁啤酒／姜汁汽水 → 姜」。

**下拉项排版**也重做了一轮。早期是把类别、标签、家族用顿号硬拼成一行再 `truncate`，结果出现「烈酒·葡萄、…」这种半截省略号。改成三段式：

- 左段：`[类型] 名称`，永不截断；
- 中段：只放 1–2 个简短风味标签（构建期预生成 `short` 字段）；
- 右段：右对齐 `家族 · N`。

同时把下拉宽度从 288px 放到 `min-w-[20rem]`，否则「老汤姆金酒」会被挤成「老…」。移动端输入框占位符也从一整句压到「搜索食材或酒谱…」，390px 宽度下刚好不折行。

<figure>
  <img src="/cocktail/search-gin.jpg" alt="搜索 gin 的下拉，三段式排版" />
  <figcaption>修正后：金酒家族优先，中段只留两个风味标签，右段对齐家族与命中数</figcaption>
</figure>

## 五、跨站融合：在极简白底博客里夹一页「特种纸手稿」

个人博客用的是 Astro 5 的现代极简白底（玫瑰红点缀），而酒吧和调酒站是偏复古的暖纸印刷风。直接嵌 iframe 会互相打架，最后选了策展式夹页（Inset）：

在首页与 `/projects` 页插入一块 **1px 细墨线 + `#faf8f5` 微暖纸底**的「AFTER HOURS · 纸上微醺」双栏插页——左半区是奶油胡子的黑白镂空眼睛线稿与「酸甜烈爽」四宫格，右半区是 `01–04` 编号的 2×2 风味切片胶囊，点击直接携带 `?selected=` 参数跳进调酒站并展开对应风味树；调酒站左上角则留一行极细导航 `← ULYSSES YANG / BLOG`。两个独立部署的站点就这样连成了一个完整的数字书房。

<figure>
  <img src="/cocktail/after-hours-inset.png" alt="博客首页的纸上微醺插页" />
  <figcaption>「纸上微醺」插页：左半区四宫格，右半区 01–04 编号胶囊带 ↗ 微箭头</figcaption>
</figure>

写法上有两处小坑值得记一下：

- Tailwind v4 里 `@apply` 不能引用自定义类名（`label-mono` 是类不是 utility），会直接报 `Cannot apply unknown utility class`，换成等价的原子类才过。
- 插页里所有文案都用全角标点。手稿风最怕半角逗号混进来，一个 `,` 就能让整块排版泄气。

## 写在最后

做个人项目最爽的时刻，不是堆了多少时髦框架，而是把生活里真实喜欢的东西——朋友的清吧、手边的酒谱、顺手的笔记——用干净克制的工程方式串成一件能长期跑下去的数字作品。

接下来这套东西会继续保持「不报红就不碰」的低维护稳态，把更多时间留给核心学习和开源社区的活。

- 酒吧官网：[奶油胡子 · BAR CREMA](https://ulysses-g-yang.github.io/crema-bar/)
- 调酒风味图谱：[cocktail-kb-site](https://ulysses-g-yang.github.io/cocktail-kb-site/)
