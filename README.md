# Linxi Blog · 小春日和

基于 Astro 的个人静态博客，**仅部署到 GitHub Pages**。

## 原作者与项目来源

**本项目引用并改编自 [cosine / cosZone](https://github.com/cosZone) 的 [Astro Koharu](https://github.com/cosZone/astro-koharu)，不是从零原创的博客主题。**

![首页使用的本地封面](public/img/site_header.webp)

## 开始使用

需要 Node.js 22.12+ 和 npm，在 `linxi-blog` 目录执行：

```sh
npm ci
npm run dev -- --background
```

终端会显示实际地址，通常为 `http://localhost:4321/`。后台服务管理：

```sh
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

验证生产效果（包括搜索）：

```sh
npm run build
npm run preview -- --background
```

**搜索使用构建产物中的 Pagefind 索引，请在生产预览中验收；开发服务器不提供搜索索引。**

## 写一篇文章

```sh
npm run new -- --title "我的第一篇笔记" --slug first-note
```

文章写入 `src/content/blog/zh/first-note.md`，默认为草稿。编辑正文、摘要和标签，发布时将 `draft` 改为 `false`，再构建并推送。

文章配图统一放在 `public/img/blog/<文章名>/` 下，与头像、封面等站点图片分开。正文使用从 Markdown 文件到图片的相对路径，以便在编辑器中预览。例如，`src/content/blog/computer.md` 中可写 `![图片](../../../public/img/blog/computer/image.png)`；构建时会自动转换为站点地址 `/img/blog/computer/image.png`。

## 功能

- Markdown 文章、草稿、置顶、分页、归档、多级分类、标签、系列和相关文章。
- 中文、英文、日文、韩文 UI；人工翻译文章；缺少翻译时回退中文。
- 本地全文搜索、明暗切换、阅读字号、阅读时间、进度和目录。
- 首页艺术字可触发菲比随机语音与多方向穿梭动画，并尊重系统的减少动态效果设置。
- 图片放大、本地封面、小尺寸图片占位符；不使用外部图床。
- Shoka 提醒块、折叠、标签页、文字特效、注音、隐藏文字、练习题、代码工具和数学公式。
- 本地渲染 Mermaid / Infographic；本地音视频播放列表。
- 无后端公告与已读状态、友链、自定义 Markdown 页面。
- 整篇及局部加密、各语言 RSS、站点地图、SEO 元数据。
- 可选轻量飘雪，默认关闭，尊重减少动态效果的系统设置。

完整配置、逐项迁移说明及限制见 **[使用与迁移指南](KOHARU-MIGRATION-GUIDE.zh-CN.md)**。

## GitHub Pages

唯一发布入口为 `.github/workflows/deploy.yml`，只上传 `dist/`。

站点配置集中在 `src/config/site.ts`。当前配置是用户站点 `https://linxi623.github.io`。


## 检查

```sh
npm test
npm run check
npm run build
npm run test:site
npm run test:browser
npm run test:encryption
```

浏览器测试默认使用本机 Google Chrome。加密集成测试会临时创建测试文章，结束后清理它们并恢复普通构建；不要与其他构建命令并发运行。

## 安全边界

加密文章仅保护发布后的网页正文，**不能保护公开 Git 仓库中的 Markdown 原文**。标题、摘要、日期、标签和封面始终公开。密码从构建环境变量读取，不写进文章；生产产物只发布静态文件。

未迁移评论、在线统计、Bangumi、动态碎碎念、Meting、AI 摘要、远程嵌入和 CMS API。普通外部超链接可以保留，但站点自身的脚本、字体、图片、媒体和数据请求限定为本站来源。
