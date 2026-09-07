import { spawnSync } from 'node:child_process';
import { writeFile, unlink, readFile, readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, join, sep, extname } from 'node:path';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const whole = resolve('src/content/blog/linxi-test-encrypted.md');
const block = resolve('src/content/blog/linxi-test-block.md');
const created = [];
const env = { ...process.env, LINXI_TEST_SECRET: 'LINXI_TEST_PASSWORD_0826' };
const wholeMarker = 'qxzprivatecanaryeightftwenty';
const blockMarker = 'qxzblockcanarysixtyone';
function build(environment = process.env) {
  const result = spawnSync('npm run build', { shell: true, encoding: 'utf8', env: environment });
  return result;
}
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path)); else result.push(path);
  }
  return result;
}
let browser;
let server;
try {
  await writeFile(whole, `---\ntitle: Encryption fixture\ndescription: Public description\ndate: 2026-09-07\nlink: linxi-test-encrypted\npasswordEnv: LINXI_TEST_SECRET\n---\n## ${wholeMarker}\n\nPrivate content.\n`, { flag: 'wx' }); created.push(whole);
  await writeFile(block, `---\ntitle: Block fixture\ndescription: Public description\ndate: 2026-09-07\nlink: linxi-test-block\n---\n## Public heading\n\nPublic introduction.\n\n:::encrypted{env="LINXI_TEST_SECRET"}\n## ${blockMarker}\n\nPrivate block.\n:::\n`, { flag: 'wx' }); created.push(block);
  const missingEnv = { ...process.env }; delete missingEnv.LINXI_TEST_SECRET;
  const failed = build(missingEnv);
  assert.notEqual(failed.status, 0, 'A missing password must fail the entire build');
  assert.match(failed.stdout + failed.stderr, /requires build environment/);
  const result = build(env);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const root = resolve('dist');
  const home = await readFile(join(root, 'index.html'), 'utf8');
  const base = new URL(home.match(/rel="canonical" href="([^"]+)"/)[1]).pathname.replace(/\/$/, '');
  for (const path of await walk(root)) {
    if (!/\.(html|js|xml|json)$/.test(path)) continue;
    const body = await readFile(path, 'utf8');
    for (const secret of [wholeMarker, blockMarker, env.LINXI_TEST_SECRET]) assert.ok(!body.includes(secret), `Leaked test plaintext in ${path}`);
  }
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      if (!pathname.startsWith(`${base}/`)) { response.writeHead(404).end(); return; }
      let path = resolve(root, `.${pathname.slice(base.length)}`);
      if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
      response.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream');
      response.end(await readFile(path));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  for (const [slug, marker] of [['linxi-test-encrypted', wholeMarker], ['linxi-test-block', blockMarker]]) {
    await page.goto(`${origin}${base}/post/${slug}/`);
    await page.locator('.unlock-form').waitFor();
    assert.ok(!(await page.locator('#article-content').innerText()).includes(marker));
    assert.ok(!(await page.locator('#toc-links').innerText()).includes(marker));
    await page.locator('.unlock-form input').fill('incorrect');
    await page.locator('.unlock-form button').click();
    await page.getByText('密码错误，请重试。').waitFor();
    await page.locator('.unlock-form input').fill(env.LINXI_TEST_SECRET);
    await page.locator('.unlock-form button').click();
    await page.locator('#article-content h2', { hasText: marker }).waitFor();
    await page.locator('#toc-links a', { hasText: marker }).waitFor();
    await page.reload();
    await page.locator('.unlock-form').waitFor();
    assert.ok(!(await page.locator('#article-content').innerText()).includes(marker), 'Passwords or decrypted content must not persist');
  }
  await page.goto(`${origin}${base}/`);
  const count = await page.evaluate(async ({ base, marker }) => {
    const index = await import(`${base}/pagefind/pagefind.js`);
    return (await index.search(marker)).results.length;
  }, { base, marker: wholeMarker });
  assert.equal(count, 0, 'Encrypted text must not be searchable');
  console.log('Verified: fail-closed build, ciphertext-only output, whole/block decryption, wrong-password handling, private TOC, reload locking, and search exclusion.');
} finally {
  await browser?.close();
  if (server) await new Promise((done) => server.close(done));
  for (const path of created) await unlink(path);
  const restored = build();
  assert.equal(restored.status, 0, restored.stdout + restored.stderr);
  console.log('Restored the normal production build without test fixtures.');
}
