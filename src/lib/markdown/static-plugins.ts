import type { Root, Element } from 'hast';
import type { Root as MdRoot } from 'mdast';
import type { Node } from 'unist';
import type { VFile } from 'vfile';
import { visit } from 'unist-util-visit';
import { toHtml } from 'hast-util-to-html';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { encryptContent } from '../crypto/encrypt';
import { withBase, siteBase } from '../urls';

function secret(name: string) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name) || !process.env[name]) {
    throw new Error(`Encrypted content requires build environment variable: ${name}`);
  }
  return process.env[name]!;
}

export function remarkEncryptedDirective() {
  return (tree: MdRoot) => {
    visit(tree, (node: Node) => {
      if (node.type !== 'containerDirective') return;
      const directive = node as Node & {
        name: string; attributes?: Record<string, string>; data?: Record<string, unknown>;
      };
      if (directive.name !== 'encrypted') return;
      if (directive.attributes?.password || !directive.attributes?.env) {
        throw new Error('Use :::encrypted{env="POST_PASSWORD"}, never commit a password in Markdown.');
      }
      secret(directive.attributes.env);
      directive.data = {
        hName: 'div',
        hProperties: { className: ['encrypted-block'], 'data-secret-env': directive.attributes.env },
      };
    });
  };
}

// Encryption is last: neither headings nor rendered HTML may retain private content.
export function rehypeEncrypt() {
  return async (tree: Root, file: VFile) => {
    const frontmatter = (file.data as { astro?: { frontmatter?: Record<string, unknown> } }).astro?.frontmatter;
    if (frontmatter?.password) throw new Error('Replace frontmatter password with passwordEnv.');
    async function encryptNode(node: Element, envName: string) {
      const html = toHtml({ type: 'root', children: node.children }, { allowDangerousHtml: true });
      const data = await encryptContent(html, secret(envName));
      node.children = [{
        type: 'element', tagName: 'noscript', properties: {},
        children: [{ type: 'text', value: 'Enable JavaScript to unlock this content.' }],
      }];
      node.properties = {
        className: ['encrypted-block'], 'data-pagefind-ignore': '',
        'data-cipher': data.cipher, 'data-iv': data.iv, 'data-salt': data.salt,
      };
    }
    // Process children first so nested blocks never leak their original attributes.
    async function walk(node: Root | Element) {
      for (const child of node.children) {
        if (child.type !== 'element') continue;
        await walk(child);
        const envName = child.properties['data-secret-env'] ?? child.properties.dataSecretEnv;
        if (envName) await encryptNode(child, String(envName));
      }
    }
    await walk(tree);
    if (frontmatter?.passwordEnv) {
      const node: Element = { type: 'element', tagName: 'div', properties: {}, children: tree.children.filter((child) => child.type !== 'doctype') };
      await encryptNode(node, String(frontmatter.passwordEnv));
      tree.children = [node];
    }
  };
}

export function rehypeLocalAssets() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (['iframe', 'script'].includes(node.tagName)) {
        throw new Error('Remote embeds and article scripts are not supported in this static migration.');
      }
      if (node.tagName === 'a' && typeof node.properties.href === 'string') {
        const href = node.properties.href;
        if (href.startsWith('/') && !href.startsWith('//')) node.properties.href = withBase(href);
        if (/^https?:/.test(href)) node.properties.rel = ['noopener', 'noreferrer'];
      }
      for (const attr of ['src', 'poster']) {
        const value = node.properties[attr];
        if (typeof value !== 'string') continue;
        if (!value.startsWith('/') || value.startsWith('//')) {
          throw new Error(`Keep article assets in public/ and use /img/... paths: ${value}`);
        }
        const unbased = value.startsWith(`${siteBase}/`) ? value.slice(siteBase.length) : value;
        const root = resolve('public');
        const target = resolve(root, `.${decodeURIComponent(unbased.split(/[?#]/)[0])}`);
        if (!target.startsWith(root + sep) || !existsSync(target)) throw new Error(`Missing local asset: ${value}`);
        node.properties[attr] = withBase(value);
      }
      if (node.tagName === 'img') {
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
      const mediaSource = node.properties.dataSrc ?? node.properties['data-src'];
      if (typeof mediaSource === 'string' && (node.properties.dataAudioPlayer !== undefined || node.properties.dataVideoPlayer !== undefined)) {
        const tracks = JSON.parse(mediaSource) as { url?: string; list?: string[] }[];
        for (const track of tracks) {
          for (const url of track.list ?? (track.url ? [track.url] : [])) {
            if (!url.startsWith('/') || url.startsWith('//')) throw new Error(`Local media only: ${url}`);
            const unbased = siteBase && url.startsWith(`${siteBase}/`) ? url.slice(siteBase.length) : url;
            const root = resolve('public');
            const target = resolve(root, `.${decodeURIComponent(unbased)}`);
            if (!target.startsWith(root + sep) || !existsSync(target)) throw new Error(`Missing local media: ${url}`);
          }
        }
      }
    });
  };
}
