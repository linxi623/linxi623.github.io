// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { site } from './src/config/site.ts';
import { siteBase } from './src/lib/urls.ts';
import { remarkShokaPreprocess } from './src/lib/markdown/remark-shoka-preprocess.ts';
import { remarkIns, remarkMark } from './src/lib/markdown/remark-shoka-effects.ts';
import { remarkShokaRuby } from './src/lib/markdown/remark-shoka-ruby.ts';
import { remarkShokaSpoiler } from './src/lib/markdown/remark-shoka-spoiler.ts';
import { rehypeShokaAttrs } from './src/lib/markdown/rehype-shoka-attrs.ts';
import { shokaMetaTransformer } from './src/lib/markdown/shiki-meta-transformer.ts';
import { remarkEncryptedDirective, remarkPublicAssets, rehypeEncrypt, rehypeLocalAssets } from './src/lib/markdown/static-plugins.ts';
import { validateContent } from './src/lib/validate-content.ts';
import { generatePlaceholders } from './src/lib/lqip.ts';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  base: siteBase || '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [{
    name: 'linxi-static-boundary',
    hooks: { 'astro:config:setup': async () => { await validateContent(); await generatePlaceholders(); } },
  }],
  markdown: {
    processor: unified({
      gfm: true,
      remarkPlugins: [
        [remarkShokaPreprocess, { enableEncryptedBlock: true }],
        remarkMath, remarkIns, remarkMark, remarkShokaRuby, remarkShokaSpoiler,
        remarkDirective, remarkEncryptedDirective, remarkPublicAssets,
      ],
      rehypePlugins: [rehypeRaw, rehypeShokaAttrs, rehypeKatex, rehypeLocalAssets, rehypeEncrypt],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'infographic'] },
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, transformers: [shokaMetaTransformer()] },
  },
  vite: { build: { sourcemap: false } },
});
