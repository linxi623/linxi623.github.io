---
title: Markdown 的小花园
description: 文字、公式、折叠与标签页，让笔记清楚又好读。
date: 2026-09-05
link: markdown-garden
categories: [工具]
tags: [Markdown, 博客]
cover: /img/cover/11.webp
---

## 文字与公式

++下划线++、==高亮==、H~2~O、x^2^，还有 {春日^はるび}。

答案先藏起来：!!保持好奇!!。

$$
E = mc^2
$$

## 给内容一点层次

:::info
先记下问题，再把解决过程写清楚。
:::

+++primary 展开一段补充
不用把所有补充内容都挤进正文，想了解时再展开。
+++

;;;notes 写作
先写一个简单的提纲。
;;;

;;;notes 修改
读一遍，删去重复的句子。
;;;

## 表格和代码

| 记录 | 形式 | 频率 |
| --- | --- | --- |
| 学习笔记 | Markdown | 学完一个知识点 |
| 日常随笔 | 短文 | 有想法的时候 |

```javascript title="一个小小的开始" mark="2"
const thoughts = ['观察', '记录', '回顾'];
console.log(thoughts.join(' → '));
```

## 友链卡片

{% links %}
- site: 余弦の博客
  url: https://blog.cosine.ren
  image: /img/avatar.webp
  desc: Astro Koharu 原作者
{% endlinks %}
