# Linxi Blog 使用与迁移指南

本文替代旧版“只迁移基础博客”的建议文档，按 2026-09-07 确认的范围实施：仅 GitHub Pages，不迁移需要额外 API 的功能；多语言、公告、加密文章保留；保留原作者署名及许可证。

## 1. 目录与职责

| 路径 | 用途 |
| --- | --- |
| `src/config/site.ts` | 站点、语言、分页、公告、友链、图片、节日开关 |
| `src/content/blog/` | Markdown 文章 |
| `src/content.config.ts` | 文章字段校验 |
| `src/lib/posts.ts` | 文章查询、分类、标签、系列、推荐和静态路由清单 |
| `src/lib/i18n.ts` | 中英日韩界面文字 |
| `src/layouts/` | 公共布局与独立 Markdown 页面布局 |
| `src/scripts/client.ts` | 浏览器交互，不请求外部 API |
| `src/lib/markdown/` | Markdown 与加密处理 |
| `public/img/` | 已迁移的本地图片 |
| `public/_lqip/` | 构建时生成的本地低分辨率图片 |
| `examples/` | 加密、局部加密、自定义页示例；默认不发布 |
| `tests/`、`scripts/` | 验证和新建文章工具 |
| `.github/workflows/deploy.yml` | 唯一生产部署入口 |

`learning_blog/astro-koharu` 仍然是只读参考，本次没有修改它。依赖没有整套照搬，也没有引入服务器适配器。

## 2. 本地使用与发布

```sh
npm ci
npm run dev -- --background
```

开发服务用于内容预览。修改站点配置后重启开发服务；新增文章后刷新页面即可。

```sh
npm run astro -- dev stop
npm run dev -- --background
```

生产预览包含 Pagefind 索引：

```sh
npm run build
npm run preview -- --background
```

停止生产预览：`npm run astro -- preview stop`。以终端打印的端口为准。开发服务与预览服务应使用不同端口。

### GitHub Pages

1. 确认最终 GitHub 仓库。
2. 在仓库 Settings → Pages 中选择 GitHub Actions。
3. 确认 `src/config/site.ts` 的 `url`、`repository` 与可选 `base`。
4. 提交到 `main`，或手动运行 Deploy Astro to GitHub Pages。
5. 工作流安装依赖、构建、检查静态产物，仅上传 `dist/`。

两种路径配置：

| 仓库 | `url` | `base` |
| --- | --- | --- |
| `linxi623/linxi623.github.io` | `https://linxi623.github.io` | 省略或空字符串 |
| `linxi623/Blog` | `https://linxi623.github.io` | `/Blog` |

`repository` 使用实际仓库的 HTTPS 地址。当前配置为第一种，本地远端在迁移时仍为第二种，需用户确认后再修改远端。迁移没有执行 git push。

站内链接通过路径工具添加前缀，不要在文章里手动重复添加 `/Blog`。`robots.txt` 会生成，但项目站点子目录下的 robots 文件不能替代整个域名根目录的爬虫规则；站点地图仍可直接提交。

## 3. 写作、草稿与文章字段

```sh
npm run new -- --title "我的笔记" --slug my-note
```

该工具不覆盖已有文件，新建文章默认为 `draft: true`。

```yaml
---
title: 我的笔记
description: 一句公开摘要
date: 2026-09-07
updated: 2026-09-08
link: my-note
locale: zh
categories: [笔记, 前端]
tags: [Astro, Markdown]
series: 前端学习
cover: /img/cover/1.webp
draft: false
pinned: false
toc: true
---
```

- `title`、`date`、`link` 必填。日期格式为 `YYYY-MM-DD`。
- `link` 是固定链接，允许小写英文字母、数字、连字符和分层斜线，不随标题变化。
- 同一语言中的 `link` 不可重复；不同语言使用相同 `link` 配对翻译。
- `description` 始终公开，用于列表、搜索和 RSS。不会调用 AI 自动生成。
- `draft: true` 不生成文章页面，不进入列表、搜索、RSS 或站点地图；草稿原文仍在 Git 仓库中。
- `pinned: true` 优先出现在文章列表中；归档和 RSS 仍按时间排序。
- `toc: false` 关闭这篇文章的目录。
- 未配置 `cover` 时，从 21 张本地默认封面中稳定选择，不会每次构建随机改变。

文件名可自由组织，但发布链接由 `link` 决定。示例正文和关于页可直接替换成自己的内容。

## 4. 列表、归档、分类、标签和系列

| 功能 | 使用方式 |
| --- | --- |
| 首页文章 | 自动读取内容集合，数量由 `site.pageSize` 控制 |
| 全部文章 | `/posts/`，自动生成后续分页 |
| 归档 | `/archives/`，按年份及发布时间显示 |
| 多级分类 | `categories: [笔记, 前端]` 代表一条“笔记/前端”层级路径 |
| 标签 | `tags` 是扁平数组，自动生成标签索引与列表 |
| 系列 | 相同 `series` 名称的文章聚合到 `/series/系列名/` |
| 前后文章 | 按发布时间连接相邻文章 |
| 相关文章 | 按标签、分类和系列的重合度推荐，最多三篇 |

分类、标签、系列名称不要包含 `/`、`\`、`#`、`?`、`%` 或纯 `.`、`..`。多级分类用数组表达。

**适配差异：** 相关文章使用可解释的本地标签规则，没有迁移上游需要下载模型的语义向量生成流程。系列采用统一 `/series/` 路径，不照搬上游“系列从首页分离、任意顶层 slug”的规则。

## 5. 多语言

默认开启 `zh`、`en`、`ja`、`ko` 四种界面语言。编辑 `site.locales` 可以减少启用语言，默认语言必须保留。

翻译文章示例：

```yaml
title: My note
link: my-note
locale: en
date: 2026-09-07
```

将它放在 `src/content/blog/en/my-note.md`。语言由 `locale` 字段决定，目录主要方便整理。

- 中文路径：`/post/my-note/`。
- 英文路径：`/en/post/my-note/`。
- 其他语言同理，全部在构建时生成。
- 缺少对应翻译时回退中文，并在文章页显示提示。
- 语言切换尽量保留当前页面，每种语言有单独 RSS 和搜索索引。
- 文章正文、公告、分类名、友链说明和关于页的个人内容不自动翻译；界面文字在 `src/lib/i18n.ts` 中维护。

需要一个新语言时，除了修改 `site.locales`，还应补充界面字典、语言名称及相应内容。

## 6. 搜索、阅读和图片

### 本地搜索

`npm run build` 最后运行 Pagefind，将索引写入 `dist/pagefind/`。页面按需加载同源静态索引，不连接搜索服务。

只索引文章的公开标题、摘要、标签和可见正文；草稿不产生页面，加密块有索引忽略标记。更新文章后需要重新构建和部署。

### 阅读工具

- 明暗切换、字号通过 localStorage 保存在当前浏览器；禁用存储时仍可临时使用。
- 目录根据当前可见标题生成，随阅读高亮；加密部分只有解锁后加入目录。
- 阅读时间是估算，整篇加密文章不显示正文阅读时间。
- 阅读进度条和回到顶部在浏览器中运行。
- 代码块支持高亮、标题、标记行、复制与浏览器全屏；全屏取决于浏览器支持。
- 文章图片支持点击或键盘打开灯箱；关闭按钮和 Escape 可返回正文。

### 图片

将图片放进 `public/img/`，Markdown 使用：

```md
![图片说明](/img/cover/2.webp)
```

不要留空图片地址，不使用图床或图片 API。封面字段也使用同样的本地地址。

`public/img/` 下的 WebP 图片会自动生成小尺寸占位符到 `public/_lqip/`。文章卡片使用占位图和原始封面，原图懒加载。图片更新后会按修改时间重新生成占位图。

## 7. Markdown 增强

可打开 `/post/markdown-garden/` 和 `/post/practice/` 查看演示。

| 功能 | 示例 |
| --- | --- |
| 下划线 | `++文字++` |
| 高亮 | `==文字==` |
| 上下标 | `x^2^`、`H~2~O` |
| 隐藏文字 | `!!点击后显示!!`，不是安全加密 |
| 注音 | `{春日^はるび}` |
| 行内公式 | `$E=mc^2$` |
| 块级公式 | 独立行 `$$` 包围公式 |
| 提醒块 | `:::info` 与 `:::` 包围正文 |
| 折叠块 | `+++primary 标题` 与 `+++` 包围正文 |
| 标签页 | 连续的 `;;;group 页名` 与 `;;;`；相同 group 会组合 |
| 属性语法 | `[文字]{.red}` |
| 代码标题/标记 | 代码围栏后写 `javascript title="示例" mark="2"` |

练习题保留 `.quiz`、`.multi`、`.true`、`.fill`、`.correct` 和 `.gap` 属性语法。单选、多选、判断、填空的完整可复制示例见 `src/content/blog/practice.md`。答案在静态页面中，不适合作为保密考试。

友链卡片可用 `{% links %}` 与 `{% endlinks %}` 包围 YAML 列表；图片仍必须为本地路径。

### 图表

用 `mermaid` 或 `infographic` 代码围栏编写图表，完整示例见 `src/content/blog/diagrams.md`。

两个引擎随站点打包，只有包含图表的文章才加载。信息图改用系统字体，已移除默认远程字体请求。不支持需要在线图标、图片或外部资源的图表定义。语法错误会保留源码，不会把正文整体隐藏。

### 本地音视频

仅支持真实存在于 `public/` 下的媒体文件：

```md
{% media audio %}
- title: 我的录音
  list:
    - /media/recording.mp3
{% endmedia %}
```

视频使用 `media video`，条目为 `name` 和 `url`。提供浏览器原生播放/暂停、进度、音量及播放列表；不附带虚构的音视频文件。不能填写网易云、Meting、Bilibili 等解析链接。

## 8. 公告、友链、独立页和季节效果

### 公告

编辑 `site.announcements`，每项包含：

```ts
{
  id: 'notice-2026-09',
  title: '更新说明',
  content: '写在这里的内容公开可见。',
  startDate: '2026-09-07T00:00:00+08:00',
  endDate: '',
}
```

浏览器按起止时间决定可见性，每分钟刷新一次。关闭后记为已读，点击铃铛可以重新查看当前有效的公告。更新为一条新公告时使用新 `id`；空数组关闭公告。时间判断依赖访客设备时钟。

### 友链

编辑 `site.friends` 的 `name`、`author`、`description`、`url`、`image`。图片为本地文件。未迁移在线友链申请和评论表单。

### 独立页

把 `examples/custom-page.md.example` 复制为 `src/pages/books.md`，修改标题和正文，就会生成 `/books/`。根级页面的布局为 `../layouts/PageLayout.astro`；更深目录需相应调整相对路径。

如需显示在导航中，编辑 `BaseLayout.astro` 中的 `nav`。独立页不会自动生成其他语言版本，语言切换返回对应语言首页；自定义页面应自行补充站点地图逻辑。

### 季节效果

`site.seasonal: true` 开启轻量本地飘雪，默认关闭。使用 2D Canvas，手机减少粒子数，系统启用减少动态效果时不显示。没有迁移上游 Three.js 场景及整套圣诞装饰。

## 9. 加密文章

实现是构建时 PBKDF2 / AES-256-GCM 加密，浏览器用 Web Crypto 本地解密。**Web Crypto 是浏览器内置能力，不是远程 API。**

### 整篇加密

将 `examples/encrypted-post.md.example` 复制为文章文件，保留：

```yaml
passwordEnv: LINXI_POST_PASSWORD
```

PowerShell 构建：

```powershell
$env:LINXI_POST_PASSWORD = '在本机设置一个足够强的密码'
npm run build
```

密码不写进 Markdown，不放入 `PUBLIC_` 环境变量。项目不会自动把 `.env` 内容注入这些插件，请通过终端环境或 CI Secrets 提供。

GitHub Actions 中创建名为 `LINXI_POST_PASSWORD` 的仓库 Secret，现有部署工作流已映射它。其他文章可用独立环境变量名，但需要同步增加 CI 的 Secret 映射。

### 局部加密

```md
:::encrypted{env="LINXI_POST_PASSWORD"}
这里是需要密码的正文。
:::
```

缺少密码会使构建失败，不会退化为发布明文。密码不保存在浏览器存储中，刷新页面重新锁定。

### 必须了解的限制

- GitHub Pages 上没有身份认证服务，只有本地密码解密；不要把它当作账号权限系统。
- **公开仓库中的 Markdown 源文仍公开**。不要把真正的秘密原文提交到公开 Git。私有源码仓库是否可使用 Pages，取决于实际账号配置。
- 当前迁移未实现“提交前离线加密源文件”的额外工作流；不要把预加密源文件当成已提供的功能。
- 标题、描述、日期、封面、标签和分类公开，不受正文加密保护。
- 本地图片和媒体仍是可直接访问的静态文件，不因位于加密正文内就获得保护。
- 密文可以被下载并离线猜测密码，需要足够强的密码。
- 未启用 JavaScript 时无法解密；需 HTTPS 或 localhost 安全上下文。
- 搜索、RSS、目录和构建产物的泄露检查是测试重点。RSS只输出公开摘要，不包含正文。

## 10. 迁移清单与差异

| 上游功能 | 本次状态 |
| --- | --- |
| 内容集合、文章页、分页、草稿、置顶 | 已迁移 |
| 归档、多级分类、标签 | 已迁移 |
| 系列文章 | 已适配为统一系列路由 |
| 多语言、语言切换、回退、各语言 RSS | 已迁移，内容翻译需人工维护 |
| 主题、阅读字号、目录、进度、阅读时间 | 已迁移 |
| Markdown 增强、公式、练习题、代码工具 | 已迁移核心语法与交互 |
| 图表与信息图 | 已迁移，本地引擎与系统字体 |
| 友链、独立 Markdown 页 | 已迁移 |
| 图片灯箱、封面、LQIP | 已迁移，本地资源 |
| 公告 | 已适配为定时公告与已读状态，不照搬优先级/自定义颜色弹窗体系 |
| 整篇和局部加密 | 已迁移，改用构建环境变量 |
| 音视频播放器 | 仅迁移本地文件播放；不迁移在线解析 |
| 相关推荐 | 改为标签/分类/系列匹配，无语义模型下载 |
| 季节效果 | 轻量飘雪，未迁移 Three.js 圣诞整套效果 |
| Koharu CLI | 提供独立的新建文章命令，不迁移上游主题升级/备份恢复 CLI；内容备份使用 Git |
| 评论、Umami 统计 | 不迁移：需要额外服务/API |
| Bangumi、动态碎碎念 | 不迁移：需要外部或 Node API |
| Meting、在线 BGM | 不迁移：需要解析 API |
| AI 自动摘要 | 不迁移：需要模型服务/API |
| Tweet、CodePen、OG 抓取 | 不迁移：依赖外部内容或网络抓取 |
| 本地 CMS | 不迁移：包含额外本地 HTTP API |
| Docker、Node adapter、其他托管平台 | 不迁移：仅支持 Pages |

## 11. 验证与维护

`npm test` 测试路径、密码、预处理与本地媒体限制。

`npm run check` 运行 Astro/TypeScript 检查。

`npm run test:site` 在构建后遍历所有 HTML，检查站内链接、图片路径、语言订阅源和静态搜索产物。

`npm run test:browser` 使用桌面/手机尺寸验证交互，并阻断非本站请求。默认用已安装的 Google Chrome；修改 `playwright.config.ts` 可更换测试浏览器。

`npm run test:encryption` 临时生成整篇及区块加密样本，验证缺密码失败、密码错误、正确解密、刷新锁定、目录和搜索排除，最后恢复普通构建。

不要并行运行构建和加密集成测试。只发布 `dist/`，不发布 `.astro/`、源码、测试目录、环境变量文件或本地备份。

图表引擎比基础博客脚本大，会产生较大动态分块的构建提示；它们按需加载，不是 API 依赖。保留原作者引用和资源来源说明，升级依赖后重新执行以上验证。
