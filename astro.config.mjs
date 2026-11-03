// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// 站点地址:自定义域名 ulyssesyang.top(GitHub Pages 绑定后站点部署在根路径)
// 注意:base 必须与部署路径一致——GitHub Pages 自定义域名 = '/'(根路径)
export default defineConfig({
  site: 'https://ulyssesyang.top',
  base: '/',
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
