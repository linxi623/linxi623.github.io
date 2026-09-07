import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) result.push(...await files(join(directory, entry.name)));
    else result.push(join(directory, entry.name));
  }
  return result;
}
const all = await files(root);
const htmlFiles = all.filter((file) => extname(file) === '.html');
const home = await readFile(join(root, 'index.html'), 'utf8');
const base = new URL(home.match(/rel="canonical" href="([^"]+)"/)[1]).pathname.replace(/\/$/, '');
const languages = [...home.matchAll(/hreflang="([^"]+)"/g)].map(([, lang]) => lang).filter((lang) => lang !== 'x-default');
const defaultLanguage = home.match(/<html lang="([^"]+)"/)[1];
const errors = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const attributePattern = /\b(?:href|src|poster)="([^"]+)"/g;
  for (const [, value] of html.matchAll(attributePattern)) {
    if (!value.startsWith('/')) continue;
    if (!value.startsWith(`${base}/`)) { errors.push(`${file}: asset/link escapes base: ${value}`); continue; }
    const path = decodeURIComponent(value.slice(base.length).split(/[?#]/)[0]);
    const target = resolve(root, `.${path}`);
    if (target !== root && !target.startsWith(root + sep)) { errors.push(`${file}: invalid path ${value}`); continue; }
    try {
      const info = await stat(target);
      if (info.isDirectory()) await stat(join(target, 'index.html'));
    } catch { errors.push(`${file}: broken local link ${value}`); }
  }
  assert.ok(!/\b(?:src|poster)="(?:https?:)?\/\//.test(html), `Remote resource in ${file}`);
  assert.ok(!html.includes('data-password='), `Password leaked in ${file}`);
}
assert.equal(errors.length, 0, errors.join('\n'));
assert.ok(htmlFiles.length > 0, 'Missing static pages');
assert.ok(all.some((file) => file.endsWith('pagefind.js')), 'Search index is missing');
for (const file of [...languages.map((lang) => lang === defaultLanguage ? 'rss.xml' : `${lang}/rss.xml`), 'sitemap.xml', 'robots.txt']) {
  assert.ok((await readFile(join(root, file), 'utf8')).length > 0, `Missing ${file}`);
}
for (const file of all.filter((file) => /\.(html|js|xml|json)$/.test(file))) {
  const body = await readFile(file, 'utf8');
  for (const secret of ['qxzprivatecanaryeightftwenty', 'qxzblockcanarysixtyone', 'LINXI_TEST_PASSWORD_0826']) {
    assert.ok(!body.includes(secret), `Private test marker leaked in ${file}`);
  }
}
console.log(`Verified ${htmlFiles.length} HTML pages, local links/assets, feeds and search index.`);
