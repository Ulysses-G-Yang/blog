/**
 * 友链数据 —— 加友链就往数组里加一条
 */
export interface Friend {
  name: string;
  desc: string;
  url: string;
  /** 头像占位字母(不传取首字母) */
  mark?: string;
}

export const FRIENDS: Friend[] = [
  {
    name: '示例 · 等你来换',
    desc: '想交换友链?在留言板留言或提 PR,附上站点名、链接和一句话介绍即可。',
    url: 'https://example.com',
    mark: '?',
  },
];
