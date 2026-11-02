/**
 * 项目展示数据 —— 加项目就往数组里加一条
 */
export interface Project {
  name: string;
  description: string;
  stack: string[];
  /** 在线访问地址(可选) */
  link?: string;
  /** 源码仓库(可选) */
  repo?: string;
  year?: string;
  status?: string;
}

export const PROJECTS: Project[] = [
  {
    name: '这个博客',
    description:
      'Astro 5 + TypeScript 手搓的个人博客:幕布转场(每会话只播一次)、双主题、pagefind 离线搜索、板块化内容,以及 GitHub Pages + 家庭服务器的双端自动部署。你正在看的就是它。',
    stack: ['Astro', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Docker'],
    link: 'https://ulysses-g-yang.github.io/blog/',
    repo: 'https://github.com/Ulysses-G-Yang/blog',
    year: '2026',
    status: '持续迭代',
  },
  {
    name: '录音转写流水线',
    description:
      '基于 faster-whisper 的本地批量转写脚本:自动生成 SHA-256 清单、VAD 过滤、核心件用大模型精转。全程本地推理,数据不出机器。',
    stack: ['Python', 'faster-whisper', 'CUDA'],
    year: '2026',
    status: '已完成',
  },
  {
    name: '文件哈希清单工具',
    description:
      '给任意目录生成 SHA-256 / MD5 清单清单(CSV + 文本),用于数据取证的时间线固定与备份完整性校验。',
    stack: ['PowerShell', 'Python'],
    year: '2026',
    status: '内部使用',
  },
];
