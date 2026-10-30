// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// 站点地址:仓库建好后即为 https://<用户名>.github.io,base 对应仓库名 /blog
// 如果以后换成 <用户名>.github.io 仓库或自定义域名,把 base 改成 '/' 即可
export default defineConfig({
  site: 'https://3023345758.github.io',
  base: '/blog',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      // 双主题代码高亮:亮色 github-light / 暗色 one-dark-pro
      themes: {
        light: 'github-light',
        dark: 'one-dark-pro',
      },
    },
  },
});
