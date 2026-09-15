import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    link: z.string().regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/),
    categories: z.array(z.string().min(1)).default([]),
    tags: z.array(z.string().min(1)).default([]),
    series: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    passwordEnv: z.string().regex(/^[A-Z][A-Z0-9_]*$/).optional(),
    password: z.never().optional(),
    toc: z.boolean().default(true),
  }),
});

export const collections = { blog };
