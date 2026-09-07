import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import sharp from 'sharp';
import { siteBase, withBase } from './urls';

export async function generatePlaceholders(directory = 'public/img') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = join(directory, entry.name);
    if (entry.isDirectory()) { await generatePlaceholders(source); continue; }
    if (!entry.name.endsWith('.webp')) continue;
    const target = join('public/_lqip', relative('public', source));
    const sourceInfo = await stat(source);
    const targetInfo = await stat(target).catch(() => null);
    if (targetInfo && targetInfo.mtimeMs >= sourceInfo.mtimeMs) continue;
    await mkdir(dirname(target), { recursive: true });
    await sharp(source).resize(24, 16, { fit: 'inside' }).webp({ quality: 25 }).toFile(target);
  }
}
export function placeholder(path: string) {
  const unbased = siteBase && path.startsWith(`${siteBase}/`) ? path.slice(siteBase.length) : path;
  return unbased.startsWith('/img/') && unbased.endsWith('.webp') ? withBase(`/_lqip${unbased}`) : undefined;
}
