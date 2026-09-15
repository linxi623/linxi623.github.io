import { allPosts, postUrl, sortPosts } from './posts';
import { site } from '../config/site';
import { withBase } from './urls';
export function xml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}
export async function feed() {
  const posts = sortPosts(await allPosts()).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const url = (path: string) => new URL(path, site.url).href;
  // Feed only explicitly public metadata, never raw Markdown or rendered private blocks.
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${withBase('/feed.xsl')}"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${xml(site.title)}</title><link>${url(withBase('/'))}</link>
<description>${xml(site.description)}</description><language>zh-CN</language>
<atom:link href="${url(withBase('/rss.xml'))}" rel="self" type="application/rss+xml"/>
${posts.map((post) => `<item><title>${xml(post.data.title)}</title><link>${xml(url(postUrl(post)))}</link><guid isPermaLink="true">${xml(url(postUrl(post)))}</guid><pubDate>${post.data.date.toUTCString()}</pubDate><description>${xml(post.data.description)}</description></item>`).join('\n')}
</channel></rss>`;
}
