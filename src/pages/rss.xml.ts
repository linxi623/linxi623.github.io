import { feed } from '../lib/feed';
export async function GET() {
  return new Response(await feed('zh'), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
