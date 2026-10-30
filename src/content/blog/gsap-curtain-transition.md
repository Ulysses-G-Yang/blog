---
title: 手搓 GTA5 官网式幕布转场:GSAP + View Transitions
description: 本站最抢眼的效果——换页时五块幕布落下再穿页而过,文章标题逐段渐入。拆解这套动效的完整实现思路。
pubDate: 2026-10-30
tags: [GSAP, 动效, CSS]
---

GTA5 官网的入场动画很有电影感:黑场,然后内容逐段浮现。这篇就拆解本站幕布转场的实现——**GSAP 负责『演』,Astro 的 View Transitions 负责『翻页』**,两者通过约定好的时序配合。

## 整体思路

动效分两个阶段:

1. **落幕**:点击链接后,5 块竖版帘片依次落下遮住整个屏幕
2. **揭幕**:新页面替换完成后,帘片继续向下穿出屏幕,同时新页面内容逐段渐入

关键在于让 Router「等一等」:等幕布落完,再真正加载新页面。

## 幕布的 HTML/CSS

```html
<div id="curtain" class="curtain" transition:persist>
  <div class="curtain-panel"></div>
  <div class="curtain-panel"></div>
  <div class="curtain-panel"></div>
  <div class="curtain-panel"></div>
  <div class="curtain-panel"></div>
</div>
```

```css
.curtain {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  visibility: hidden; /* 平时完全隐形 */
}
.curtain.is-animating {
  visibility: visible;
}
.curtain-panel {
  transform: translateY(-101%); /* 帘片平时悬在视口上方 */
  background: linear-gradient(180deg, #15152a, #0d0d18);
}
```

`transition:persist` 是点睛之笔:换页时 Astro 会替换整个 DOM,而幕布需要**跨页面存活**,这个指令让它免疫换页。

## 让 Router 等幕布落完

Astro 的 `astro:before-preparation` 事件允许覆盖 Router 的加载函数:

```typescript
document.addEventListener('astro:before-preparation', (event) => {
  const originalLoader = event.loader;
  event.loader = async () => {
    coverNow();          // 开始落幕
    await coverPromise;  // 等幕布完全遮住屏幕
    await originalLoader(); // 这时才去加载新页面
  };
});
```

时序变成:**落幕 → 加载 → 替换 DOM → 揭幕**。全程不会看到新页面的「半成品」。

## 揭幕与内容渐入

换页完成后 `astro:page-load` 事件触发,先让帘片穿页而过:

```typescript
gsap.timeline()
  .to(logo, { opacity: 0, duration: 0.18 })
  .to(panels, {
    yPercent: 101,       // 从上方 -101% 到 +101%,穿过整个屏幕
    duration: 0.6,
    ease: 'power4.inOut',
    stagger: 0.05,
  }, '<0.05');
```

然后给页面里的 `[data-hero]` 容器做逐段渐入:

```typescript
gsap.fromTo(
  hero.children,
  { opacity: 0, y: 36, filter: 'blur(8px)' },
  {
    opacity: 1, y: 0, filter: 'blur(0px)',
    duration: 0.9, stagger: 0.09, ease: 'power3.out',
  },
);
```

`y` 位移 + 微模糊,就是 GTA5 官网那种「从远处浮现」的感觉。

## 细节才是质感

- **`prefers-reduced-motion`**:系统开启减弱动效时,跳过所有动画直接显示内容——酷要酷得有礼貌
- **`ease` 的选择**:`power3.inOut` 落幕(先缓后急),`power4.inOut` 揭幕(更有冲劲),相同的 ease 会显得呆
- **stagger 错峰**:帘片之间差 55ms,内容元素之间差 90ms,错峰才有「剧场感」
- **性能**:全程只用 `transform` 和 `opacity`,都在 GPU 合成层上,不掉帧

## 缝合指南

想换掉这套效果?动效全部集中在两个地方:

1. `src/components/Curtain.astro` —— 幕布本体
2. `BaseLayout.astro` 的全局脚本 —— 时序控制(搜 `幕布转场` 注释)

把这两处替换成你找到的任何转场方案就行,页面结构完全不用动。
