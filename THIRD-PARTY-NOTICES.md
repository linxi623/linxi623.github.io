# 上游引用与第三方资源

## Astro Koharu

- 原作者：cosine / cosZone。
- 原项目：https://github.com/cosZone/astro-koharu
- 原作者博客：https://blog.cosine.ren
- 本地参考版本：6.3.0。
- 参考提交：`349a8d5fa6842786e270c285099c98d7f0fc6d03`。
- 原始许可证：GNU Affero General Public License version 3，完整原文保存在根目录 `LICENSE`。
- 迁移日期：2026-09-07。

Linxi Blog 引用、改编了以下上游源码，保留其原始注释与许可证：

| 当前路径 | 来源与修改 |
| --- | --- |
| `src/lib/markdown/remark-shoka-preprocess.ts` | 上游同名插件 |
| `src/lib/markdown/shoka-preprocessor.ts` | 上游 Shoka 预处理器；错误媒体配置改为构建失败 |
| `src/lib/markdown/shoka-renderers.ts` | 上游 HTML 渲染器；增加站点前缀与本地资源限制 |
| `src/lib/markdown/remark-shoka-effects.ts` | 上游文字效果插件 |
| `src/lib/markdown/remark-shoka-ruby.ts` | 上游注音插件 |
| `src/lib/markdown/remark-shoka-spoiler.ts` | 上游隐藏文字插件；浏览器端用本项目的显隐交互适配 |
| `src/lib/markdown/rehype-shoka-attrs.ts` | 上游属性语法插件 |
| `src/lib/markdown/shiki-meta-transformer.ts` | 上游代码元数据转换 |
| `src/lib/crypto/encrypt.ts`、`decrypt.ts`、`constants.ts` | 上游 PBKDF2 / AES-256-GCM 实现 |

`src/lib/markdown/static-plugins.ts` 的整篇/区块加密流程参考了上游的 encrypted remark/rehype 插件，改为构建环境变量引用，并对本地资源及不支持的嵌入添加校验。

页面布局参考原有 Linxi 首页及 Koharu 的侧栏、文章列表和阅读布局。路由、内容查询、原生浏览器交互、静态限制与测试由本次迁移重新组织。未复制上游的后端、CMS、部署栈或完整依赖清单。

## 图片与静态字体

`public/img/` 中的头像、站点头图、周刊头图、21 张默认封面及效果图片来自本地上游项目同名目录。`public/_lqip/` 为这些图片在本地生成的小尺寸派生图。

**图片并非 Linxi 绘制。** 本次保留上游资源用于迁移和演示；上游本地目录未提供这些插画逐张对应的画师和独立授权清单，因此不声称其美术版权归 Linxi，也不额外承诺商业授权。公开使用时应继续保留已有来源信息；如取得更具体的画师署名或授权信息，应补充在这里。

`public/katex/` 来自上游的 KaTeX 静态目录，包含样式和数学字体；KaTeX 许可证同时保存在 `public/katex/LICENSE`。其他 npm 依赖保留各自包中的许可证。

## 文章与演示

首页原有三篇标题、摘要及关于页原有文字已保留，文章正文和功能示例为迁移时补充的演示内容，没有将原作者的个人文章冒充为 Linxi 原创文章。

本项目不是原作者的官方网站或官方发行版。再次感谢 Astro Koharu 及其依赖项目。
