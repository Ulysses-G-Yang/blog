/**
 * 站点全局配置 —— 改这里就够了,不用到处翻代码
 */

export const SITE = {
  /** 站点名(浏览器标题、页头 Logo、RSS) */
  title: 'Ulysses Yang 的技术博客',
  /** 站点描述(SEO / RSS / 分享卡片) */
  description: '一个关于前端、工程化与奇技淫巧的个人技术博客。',
  /** 作者名 */
  author: 'Ulysses Yang',
  /** 你的 GitHub 主页(页脚、关于页都会用到) */
  url: 'https://ulysses-g-yang.github.io',
  github: 'https://github.com/Ulysses-G-Yang',
  /** 联系邮箱(展示在关于页,不需要可留空) */
  email: '3023345758@qq.com',
};

/**
 * giscus 评论配置:到 https://giscus.app 按引导生成 4 个值填进来即可启用。
 * repoId / categoryId 是 giscus 生成的那两串 base64,别和仓库名搞混。
 * 任一项为空 = 评论功能关闭,页面不报错。
 */
export const GISCUS = {
  repo: 'Ulysses-G-Yang/blog', // 公开仓库,需在仓库设置里开启 Discussions
  repoId: 'R_kgDOVc-fLw', // 通过 GitHub GraphQL API 查询获得
  category: 'Announcements',
  categoryId: 'DIC_kwDOVc-fL84DKNXZ', // Announcements 分类(仅管理员可发起,读者可回复)
};

/**
 * umami 访问统计:家里服务器上跑起来之后,把部署地址填进来即可启用。
 * src 是 umami 脚本地址(如 http://192.168.1.33:3001/script.js)
 * 任一项为空 = 不注入统计脚本。
 */
export const UMAMI = {
  src: '', // 例如 'http://192.168.1.33:3001/script.js'
  websiteId: '', // umami 后台添加网站后生成
};

/**
 * Cloudflare Web Analytics:公网访客统计(免费、无 Cookie、不需要服务器)。
 * 到 https://dash.cloudflare.com → Web Analytics 添加站点,
 * 把它给的 beacon 脚本里的 token 填进来。留空 = 不启用。
 */
export const ANALYTICS = {
  cloudflareToken: '6fb3dd2d1f9747d2bfbb405db0b9af88',
};

/** 导航栏(顺序即展示顺序) */
export const NAV = [
  { href: '/', label: '首页' },
  { href: '/blog/', label: '博客' },
  { href: '/projects/', label: '项目' },
  { href: '/guestbook/', label: '留言板' },
  { href: '/tags/', label: '标签' },
  { href: '/archive/', label: '归档' },
  { href: '/about/', label: '关于' },
] as const;
