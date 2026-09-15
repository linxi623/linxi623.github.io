import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../config/site';
import { segment, withBase } from './urls';

export type Post = CollectionEntry<'blog'>;
export async function allPosts() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const seen = new Set<string>();
  for (const post of posts) {
    const key = post.data.link;
    if (seen.has(key)) throw new Error(`Duplicate article route: ${key}`);
    seen.add(key);
  }
  return posts;
}
export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) =>
    Number(b.data.pinned) - Number(a.data.pinned) || b.data.date.getTime() - a.data.date.getTime(),
  );
}
export function postUrl(post: Post) {
  return withBase(`/post/${post.data.link}/`);
}
export function cover(post: Post) {
  let hash = 0;
  for (const char of post.data.link) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return withBase(post.data.cover || `/img/cover/${hash % 21 + 1}.webp`);
}
export function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(date);
}
export function readingMinutes(post: Post) {
  if (post.data.passwordEnv) return null;
  const body = post.body ?? '';
  return Math.max(1, Math.ceil((body.match(/[\u3400-\u9fff]/g)?.length ?? 0) / 350 + body.split(/\s+/).length / 220));
}
export function wordCount(post: Post) {
  return (post.body ?? '').trim().split(/\s+/).filter(Boolean).length;
}
export function terms(posts: Post[], key: 'tags' | 'categories') {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const values = key === 'categories'
        ? post.data.categories.map((_, index) => post.data.categories.slice(0, index + 1).join('/'))
        : post.data.tags;
    for (const value of new Set(values)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b, 'zh'));
}
export function taxonomyUrl(key: string, value: string) {
  return withBase(`/${key}/${value.split('/').map(segment).join('/')}/`);
}
export function relatedPosts(post: Post, posts: Post[]) {
  return posts.filter((other) => other.data.link !== post.data.link).map((other) => ({
    post: other,
    score: other.data.tags.filter((tag) => post.data.tags.includes(tag)).length * 2
      + Number(Boolean(post.data.series && post.data.series === other.data.series))
      + other.data.categories.filter((category) => post.data.categories.includes(category)).length,
  })).filter((other) => other.score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.date.getTime() - a.post.data.date.getTime())
    .slice(0, 3).map(({ post: other }) => other);
}
export type View = { kind: 'home' | 'posts' | 'archives' | 'categories' | 'tags' | 'series' | 'friends' | 'about' | 'post'; term?: string; page?: number; post?: Post; path: string };
export async function views() {
  const all = await allPosts();
  const result: View[] = [];
  const posts = sortPosts(all);
  result.push({ kind: 'home', path: '/' });
  for (const kind of ['archives', 'categories', 'tags', 'about'] as const) result.push({ kind, path: `/${kind}/` });
  const pages = Math.max(1, Math.ceil(posts.length / site.pageSize));
  for (let page = 1; page <= pages; page++) result.push({ kind: 'posts', page, path: page === 1 ? '/posts/' : `/posts/${page}/` });
  for (const key of ['categories', 'tags'] as const) {
    for (const [term] of terms(posts, key)) result.push({ kind: key, term, path: `/${key}/${term}/` });
  }
  for (const post of posts) result.push({ kind: 'post', post, path: `/post/${post.data.link}/` });
  return result;
}
