import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const { values } = parseArgs({
  options: { title: { type: 'string' }, slug: { type: 'string' }, locale: { type: 'string', default: 'zh' } },
});
if (!values.title || !values.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug) || !['zh', 'en', 'ja', 'ko'].includes(values.locale)) {
  console.error('Usage: npm run new -- --title "My article" --slug my-article [--locale zh]');
  process.exit(1);
}
const file = resolve('src/content/blog', values.locale, `${values.slug}.md`);
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const content = `---
title: ${JSON.stringify(values.title)}
description: ""
date: ${date}
link: ${values.slug}
locale: ${values.locale}
categories: []
tags: []
cover: /img/cover/1.webp
draft: true
---

## ${values.title}

`;
await mkdir(dirname(file), { recursive: true });
await writeFile(file, content, { encoding: 'utf8', flag: 'wx' });
console.log(file);
