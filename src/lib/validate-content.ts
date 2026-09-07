import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { parseFrontmatter, createMarkdownProcessor } from '@astrojs/markdown-remark';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import { remarkEncryptedDirective, rehypeLocalAssets } from './markdown/static-plugins';
import { remarkShokaPreprocess } from './markdown/remark-shoka-preprocess';
import rehypeRaw from 'rehype-raw';
import { site } from '../config/site';
import { siteBase } from './urls';

async function markdownFiles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) result.push(...await markdownFiles(join(directory, entry.name)));
    else if (entry.name.endsWith('.md')) result.push(join(directory, entry.name));
  }
  return result;
}
async function localAsset(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error(`Resource must use a local /img/... path: ${path}`);
  const root = resolve('public');
  const relative = siteBase && path.startsWith(`${siteBase}/`) ? path.slice(siteBase.length) : path;
  const target = resolve(root, `.${decodeURIComponent(relative.split(/[?#]/)[0])}`);
  if (!target.startsWith(root + sep)) throw new Error(`Resource escapes public/: ${path}`);
  if (!(await stat(target)).isFile()) throw new Error(`Missing image: ${path}`);
}
export async function validateContent() {
  if (!site.locales.includes(site.defaultLocale) || new Set(site.locales).size !== site.locales.length) throw new Error('Invalid locale configuration.');
  if (siteBase && !/^\/[a-zA-Z0-9_-]+$/.test(siteBase)) throw new Error('Pages base must be empty or a single /repository path.');
  const known = new Set<string>();
  const processor = unified().use(remarkParse).use(remarkDirective).use(remarkEncryptedDirective);
  const resourceCheck = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [[remarkShokaPreprocess, { enableEncryptedBlock: true }], remarkDirective, remarkEncryptedDirective],
    rehypePlugins: [rehypeRaw, rehypeLocalAssets],
  });
  for (const file of await markdownFiles(resolve('src/content/blog'))) {
    const parsed = parseFrontmatter(await readFile(file, 'utf8'));
    const data = parsed.frontmatter;
    const key = `${data.locale ?? site.defaultLocale}/${data.link}`;
    if (known.has(key)) throw new Error(`Duplicate article link: ${key}`);
    known.add(key);
    if ('password' in data) throw new Error(`Never commit passwords in frontmatter: ${file}`);
    if (data.passwordEnv && !process.env[data.passwordEnv]) throw new Error(`Encrypted content requires build environment variable: ${data.passwordEnv}`);
    for (const name of [...(data.categories ?? []), ...(data.tags ?? []), ...(data.series ? [data.series] : [])]) {
      if (typeof name !== 'string' || !name.trim() || /[\\/#?%]/.test(name) || ['.', '..'].includes(name)) throw new Error(`Invalid taxonomy name in ${file}: ${name}`);
    }
    if (data.cover) await localAsset(data.cover);
    await processor.run(processor.parse(parsed.content));
    await resourceCheck.render(parsed.content);
  }
  await Promise.all([site.avatar, site.cover, ...site.friends.map((friend) => friend.image)].map(localAsset));
}
