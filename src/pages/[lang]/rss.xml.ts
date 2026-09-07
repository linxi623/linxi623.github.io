import { feed } from '../../lib/feed';
import { site } from '../../config/site';
export function getStaticPaths() { return site.locales.filter((lang) => lang !== site.defaultLocale).map((lang) => ({ params: { lang } })); }
export async function GET({ params }: { params: { lang?: string } }) {
  return new Response(await feed(params.lang!), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
