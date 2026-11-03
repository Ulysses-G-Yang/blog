/**
 * 开源仓库全量数据 —— 诚实版:包括 fork 的上游项目和一眼失败品的练手作
 * lastPush 用于标注活跃度,fork 标注上游来源
 */
export interface Repo {
  name: string;
  desc: string;
  /** 诚实评语(自己写的,不装) */
  note: string;
  /** fork 的上游仓库(非 fork 则不填) */
  upstream?: string;
  url: string;
  lastPush: string;
}

export const REPOS: Repo[] = [
  {
    name: 'blog',
    desc: '个人技术博客:Astro 5 + TypeScript + 幕布转场动效',
    note: '你正在看的这个。系列文章《从零搭博客》就是拿它开的刀。',
    url: 'https://github.com/Ulysses-G-Yang/blog',
    lastPush: '2026-11-03',
  },
  {
    name: 'approval-first-research-automation',
    desc: '配置驱动的通用网页数据采集框架,支持 Playwright、Scrapling 自适应解析与可选 LLM 选择器修复',
    note: '采集类项目的主干,还在迭代。',
    url: 'https://github.com/Ulysses-G-Yang/approval-first-research-automation',
    lastPush: '2026-10-27',
  },
  {
    name: 'sts2-web',
    desc: '在浏览器里运行的《杀戮尖塔 2》:规则代码机械转译成 TypeScript + Preact + Pixi',
    note: 'fork 自 moonrailgun/sts2-web。巨佬的机械转译项目,fork 留档 + 本地跑通。',
    upstream: 'moonrailgun/sts2-web',
    url: 'https://github.com/Ulysses-G-Yang/sts2-web',
    lastPush: '2026-10-10',
  },
  {
    name: 'article-auto-publisher',
    desc: '自动化文章发布工具:小黑盒与中关村在线的文档解析、NLP 话题匹配与拟人化自动发布',
    note: '发布自动化的前身,已经被后续工具链取代了一半。',
    url: 'https://github.com/Ulysses-G-Yang/article-auto-publisher',
    lastPush: '2026-10-19',
  },
  {
    name: 'approval-first-publisher',
    desc: 'Approval-first 内容发布工具:预览、审核后发布到知乎、掘金、CSDN 等平台',
    note: '「先审后发」理念和这个网站投稿流程同源。',
    url: 'https://github.com/Ulysses-G-Yang/approval-first-publisher',
    lastPush: '2026-07-23',
  },
  {
    name: 'hybrid-attention-context-guard',
    desc: 'AI 辅助编码会话中的上下文溢出智能防护与恢复',
    note: '给 AI 编码会话上的保险丝,解决上下文爆炸问题。',
    url: 'https://github.com/Ulysses-G-Yang/hybrid-attention-context-guard',
    lastPush: '2026-07-12',
  },
  {
    name: 'polypost',
    desc: '一次编写,9 平台发布。开源多平台内容发布工具(Python + Playwright)',
    note: 'fork 自 wxfwxf911/polypost,按自己需求改造中。',
    upstream: 'wxfwxf911/polypost',
    url: 'https://github.com/Ulysses-G-Yang/polypost',
    lastPush: '2026-08-11',
  },
  {
    name: 'deepseek-harness',
    desc: 'DeepSeek Harness: Everything is a Plugin.',
    note: 'fork 自 deepseek-ai 官方仓库,插件化玩法研究。',
    upstream: 'deepseek-ai/deepseek-harness',
    url: 'https://github.com/Ulysses-G-Yang/deepseek-harness',
    lastPush: '2026-08-13',
  },
  {
    name: 'cs-Vue3-FastAPI',
    desc: 'Vue3 + Element Plus + FastAPI 的中后台管理框架(若依的 FastAPI 版),支持代码生成',
    note: 'fork 自 insistence/RuoYi-FastAPI,脚手架留档。',
    upstream: 'insistence/RuoYi-FastAPI',
    url: 'https://github.com/Ulysses-G-Yang/cs-Vue3-FastAPI',
    lastPush: '2026-05-19',
  },
  {
    name: '3D-lottery-system',
    desc: '彩票预选系统:福彩 3D 和双色球预测,支持 LSTM 算法和移动端优化',
    note: 'fork 留档。LSTM 预测彩票……效果你猜。理性购彩。',
    upstream: 'LJQ-HUB-cmyk/3D-lottery-system',
    url: 'https://github.com/Ulysses-G-Yang/3D-lottery-system',
    lastPush: '2025-09-30',
  },
];
