---
title: "博客大升级:粒子背景、磁性按钮,和一通叫我删动画的电话"
description: "记本次博客大升级的全过程:一通叫停转场动画的电话、Code Barcelona 风格拆解、白底定调的取舍,以及粒子背景、双跑马灯、磁性按钮、自动 OG 分享图的完整实现与踩坑。"
pubDate: 2026-11-02
category: tech
series: 从零搭博客
seriesOrder: 3
tags: [Astro, GSAP, 动效, 前端]
---

这是「从零搭博客」系列的第三篇。前两篇讲了怎么搭骨架、怎么做幕布转场,这一篇记录博客的第一次大改版——以及改版路上那通让我心服口服的电话。

## 一通电话,一个产品课

改版前,我美滋滋地给每个页面都加了幕布转场,直到长辈打来电话:

> "效果固然重要,但你使用一个网站用久了的时候,就会很烦。要不就让它切换一次,以后再切换的时候就不会再出现这种特效。"

一针见血。**高频动效 = 审美疲劳**,这是产品铁律。最后的方案是个折中艺术:

1. 打开网站:不播幕布,只走轻量的入场动画
2. 会话内第一次切页:幕布登场,只此一次
3. 之后的每次换页:归于平静(浏览器原生淡入)

技术上是一个小状态机,用 `sessionStorage` 记账:

```typescript
// 会话内第一次切页:幕布登场,只此一次
document.addEventListener('astro:before-preparation', (event) => {
  const originalLoader = event.loader;
  event.loader = async () => {
    if (!sessionStorage.getItem('curtain-used') && !reduceMotion) {
      sessionStorage.setItem('curtain-used', '1');
      await Promise.race([curtainIn(), wait(1200)]);
    }
    await originalLoader.call(event);
  };
});
```

> 学到的事:**解决问题的办法经常是给效果加条件,而不是删效果。**

## 风格定调:从参考站到白底

第二件事是视觉。我拆解了一个喜欢的 agency 官网,提炼出它的设计骨架:超大双色标题、等宽大写小标签、巨型跑马灯、细边框卡片、大数字统计带。

但它的深墨紫底色和"白色打底"的诉求冲突了。最后的取舍是:**排版骨架全盘吸收,底色回到白色**,玫瑰红做唯一点缀色,深墨紫降级为暗色主题。现在首页的结构就是这样长出来的:

```html
<h1 class="text-5xl font-black uppercase sm:text-7xl">
  你好,我是<br />
  <span class="text-accent">Ulysses Yang</span>
</h1>
```

## 这次加了什么

### 1. Hero 交互式粒子背景

首页标题后面铺了一层 canvas 粒子场:粒子漂移、临近连线、鼠标靠近排斥。性能上做了三件事——粒子数量按屏幕面积封顶、滚出视口或切走标签页时暂停、换页自动销毁:

```typescript
const draw = () => {
  if (!canvas.isConnected) return; // 换页后自终止
  if (visible && inView) draw();
  requestAnimationFrame(draw);
};
```

### 2. 磁性按钮 + 光标环

按钮在光标靠近时被轻轻"吸住",离开时弹性归位;光标后面跟着一枚玫瑰色圆环,悬停可交互元素时放大。核心就几行:

```typescript
el.addEventListener('mousemove', (e) => {
  const r = el.getBoundingClientRect();
  gsap.to(el, {
    x: (e.clientX - r.left - r.width / 2) * 0.26,
    y: (e.clientY - r.top - r.height / 2) * 0.26,
    duration: 0.3,
  });
});
```

### 3. 双跑马灯 + 滚动变速

跑马灯升级成上下两条反向滚动,而且**滚动越快,它们滑得越快**。实现不是改 CSS 动画参数,而是用 `document.getAnimations()` 拿到动画实例,直接调 `playbackRate`:

```typescript
gsap.ticker.add(() => {
  const v = window.scrollY - lastY;
  const target = Math.min(5, Math.max(1, 1 + Math.abs(v) * 0.06));
  rate += (target - rate) * 0.08;
  for (const anim of marqueeAnims) anim.playbackRate = rate;
});
```

### 4. 代码块 mac 窗口栏

技术博客的标配细节:红黄绿三点 + 语言名 + 复制按钮。有个 HTML 常识坑——不能把 `div` 直接塞进 `<pre>` 里(不合法),正确做法是包一层 wrapper:

```typescript
const wrap = document.createElement('div');
wrap.className = 'code-wrap';
pre.parentNode?.insertBefore(wrap, pre);
wrap.appendChild(pre);      // pre 挪进 wrapper
wrap.appendChild(bar);      // 标题栏放在 wrapper 里
```

### 5. 每篇文章自动 OG 分享图

以前全站共用一张分享图,现在每篇文章都有自己的卡片:CI 构建时用 satori 渲染标题、日期、标签,再经 sharp 转成 PNG。中文字体走 CI 缓存,不用进仓库。文章的 `<meta>` 指向自己的专属图,发到群里每张都不一样。

### 6. 「本周折腾」短内容流

长文更新慢,是所有博客的宿命。加了一个微博式的短内容板块:一段话一篇,踩坑、碎碎念、里程碑都往里扔。首页有了"活着"的气息,更新压力也小了。

## 这轮踩的坑

1. **Astro 模板表达式里,正则不能包含反引号**——编译器会把反引号当成模板字符串开头,直接报语法错误。解法:把清洗逻辑挪到 frontmatter 里
2. **`astro preview` 在 Windows 上会缓存文件清单**——构建生成的新文件,旧预览进程会 404。本地验收不可靠时,直接推上去看线上
3. **View Transitions 换页会替换整个 body**——全局脚本里缓存的 DOM 引用全部失效,要么每次实时查询,要么给元素加 `transition:persist`
4. **C 盘满了连 sed 都会失败**——项目连夜搬去了大盘,顺便学会了:构建型项目的默认工作区,一开始就该放空间大的盘

## 复盘

这轮改版最大的收获,不是粒子也不是跑马灯,而是理解了一件事:

**炫酷是首因效应,克制是近因效应。** 首次访问要惊艳,日常使用要无感——好的动效设计,是在这两者之间画出一条清晰的时间线。

接下来就是好好写文章了。系列第四篇见。
