export const text = {
  home: '首页', posts: '文章', archives: '归档', categories: '分类', tags: '标签',
  series: '系列', friends: '友链', about: '关于', search: '搜索', theme: '切换明暗',
  latest: '最近文章', all: '全部文章', read: '阅读文章', previous: '上一页', next: '下一页',
  toc: '文章目录', minutes: '分钟', pinned: '置顶', encrypted: '加密文章',
  password: '密码', unlock: '解锁', wrongPassword: '密码错误，请重试。',
  announcement: '公告', dismiss: '关闭公告', empty: '暂时没有文章', related: '相关文章',
  greeting: '你好，我是 Linxi', intro: '这里是我的地盘，我爱写啥写啥。',
  subscribe: '订阅 RSS', settings: '阅读设置', fontSize: '字号', copy: '复制',
  copied: '已复制', fullscreen: '全屏', close: '关闭', top: '回到顶部',
  searchPlaceholder: '搜索文章内容…', source: '项目源码', back: '返回首页',
  progress: '阅读进度', noScript: '此交互需要启用 JavaScript。',
  translation: '语言', footer: '保持好奇，慢慢记录。', submitted: '检查答案',
  correct: '回答正确', incorrect: '再想一想', reset: '重置', date: '发布于',
} as const;

export function t() {
  return text;
}