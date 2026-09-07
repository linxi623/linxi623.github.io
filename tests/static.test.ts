import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptContent } from '../src/lib/crypto/encrypt';
import { decryptContent } from '../src/lib/crypto/decrypt';
import { rehypeEncrypt, remarkEncryptedDirective, rehypeLocalAssets } from '../src/lib/markdown/static-plugins';
import { withBase, localized, absolute, siteBase } from '../src/lib/urls';
import { preprocessShokaSyntax } from '../src/lib/markdown/shoka-preprocessor';
import { renderAudioMedia } from '../src/lib/markdown/shoka-renderers';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import type { Root } from 'hast';
import { VFile } from 'vfile';

test('project Pages paths are prefixed exactly once', () => {
  assert.equal(withBase('/img/avatar.webp', '/Blog'), '/Blog/img/avatar.webp');
  assert.equal(withBase('/Blog/img/avatar.webp', '/Blog'), '/Blog/img/avatar.webp');
  assert.equal(withBase('/img/avatar.webp', ''), '/img/avatar.webp');
  assert.equal(localized('/posts/', 'en'), `${siteBase}/en/posts/`);
  assert.equal(localized('/'), `${siteBase}/`);
  assert.equal(absolute('/rss.xml'), `https://linxi623.github.io${siteBase}/rss.xml`);
  assert.equal(withBase('https://example.com'), 'https://example.com');
});
test('AES-GCM decrypts only with the correct password and authentic ciphertext', async () => {
  const data = await encryptContent('<h2>private</h2>', 'long-test-password');
  assert.equal(await decryptContent(data.cipher, data.iv, data.salt, 'long-test-password'), '<h2>private</h2>');
  assert.equal(await decryptContent(data.cipher, data.iv, data.salt, 'wrong'), null);
  assert.equal(await decryptContent(`${data.cipher.slice(0, 8)}AAAA${data.cipher.slice(12)}`, data.iv, data.salt, 'long-test-password'), null);
});
test('whole-post encryption removes plaintext and fails closed without its environment secret', async () => {
  const tree: Root = { type: 'root', children: [{ type: 'element', tagName: 'h2', properties: {}, children: [{ type: 'text', value: 'PRIVATE_CANARY' }] }] };
  const file = new VFile();
  file.data = { astro: { frontmatter: { passwordEnv: 'LINXI_TEST_SECRET' } } };
  delete process.env.LINXI_TEST_SECRET;
  await assert.rejects(rehypeEncrypt()(structuredClone(tree), file), /requires build environment/);
  process.env.LINXI_TEST_SECRET = 'test-password-not-in-output';
  try {
    const encrypted = structuredClone(tree);
    await rehypeEncrypt()(encrypted, file);
    assert.ok(!JSON.stringify(encrypted).includes('PRIVATE_CANARY'));
    assert.ok(!JSON.stringify(encrypted).includes(process.env.LINXI_TEST_SECRET));
    assert.ok(JSON.stringify(encrypted).includes('data-pagefind-ignore'));
  } finally { delete process.env.LINXI_TEST_SECRET; }
});
test('encrypted blocks require an environment reference', async () => {
  const processor = unified().use(remarkParse).use(remarkDirective).use(remarkEncryptedDirective);
  await assert.rejects(processor.run(processor.parse(':::encrypted{password="unsafe"}\nSecret\n:::')), /never commit a password/);
  await assert.rejects(processor.run(processor.parse(':::encrypted\nSecret\n:::')), /never commit a password/);
});
test('Shoka constructs survive preprocessing without modifying fenced code', () => {
  const output = preprocessShokaSyntax('+++info Details\nText\n+++\n\n```text\n+++info Literal\n```');
  assert.match(output, /<details/);
  assert.match(output, /```text\n\+\+\+info Literal/);
  assert.match(preprocessShokaSyntax(':::encrypted{env="KEY"}\nPrivate\n:::'), /:::encrypted/);
});
test('media never resolves through Meting or other external APIs', () => {
  assert.throws(() => renderAudioMedia([{ url: 'https://music.163.com/playlist?id=123' }]), /Only local/);
  assert.ok(renderAudioMedia([{ url: '/media/audio.mp3' }]).includes(`${siteBase}/media/audio.mp3`));
});
test('raw article resources reject missing files, third-party hosts and embedded scripts', () => {
  for (const src of ['/img/missing-test-image.webp', 'https://example.com/avatar.webp', '//example.com/a.png']) {
    const tree: Root = { type: 'root', children: [{ type: 'element', tagName: 'img', properties: { src }, children: [] }] };
    assert.throws(() => rehypeLocalAssets()(tree), /local|public/i);
  }
  const script: Root = { type: 'root', children: [{ type: 'element', tagName: 'script', properties: {}, children: [] }] };
  assert.throws(() => rehypeLocalAssets()(script), /not supported/);
});
