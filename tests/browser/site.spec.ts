import { test, expect } from '@playwright/test';
import { siteBase } from '../../src/lib/urls';
const route = (path: string) => `${siteBase}${path}`;

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (request) => {
    const url = new URL(request.request().url());
    if (url.hostname !== '127.0.0.1' && url.protocol !== 'data:') {
      await request.abort();
      throw new Error(`Unexpected external request: ${url.href}`);
    }
    await request.continue();
  });
});
test('home, local imagery, theme, announcements, languages and responsive layout', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(route('/'));
  await expect(page.locator('.hero h1')).toHaveText('小春日和');
  await expect(page.locator('.post-card')).toHaveCount(5);
  await expect(page.locator('svg.lucide-search')).toBeVisible();
  await expect.poll(() => page.locator('.hero > img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.locator('#theme-toggle').click();
  const selected = await page.locator('html').getAttribute('class');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('class', selected ?? '');
  await page.locator('.dismiss-notice').click();
  await page.reload();
  await expect(page.locator('.announcement')).toBeHidden();
  await page.locator('#announcement-open').click();
  await expect(page.locator('.announcement')).toBeVisible();
  await page.locator('#language-select').selectOption(route('/en/'));
  await expect(page).toHaveURL(new RegExp('/en/$'));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.post-card h3').first()).toHaveText('A beginning in the little spring');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${info.project.name}-home.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('static search works with network limited to this origin', async ({ page }) => {
  await page.goto(route('/'));
  await page.locator('#search-open').click();
  await page.locator('.search-input').fill('Markdown');
  await expect(page.locator('.search-results li').first()).toBeVisible();
  await page.locator('.search-results a').first().click();
  await expect(page.locator('#article-content')).toBeVisible();
});
test('Markdown tabs, spoilers, copy tools, image lightbox and TOC', async ({ page }, info) => {
  await page.goto(route('/post/markdown-garden/'));
  await expect(page.locator('#toc-links a').first()).toBeVisible();
  await page.getByRole('tab', { name: '修改', exact: true }).click();
  await expect(page.locator('.tab-panel.active')).toContainText('删去重复的句子');
  await page.locator('spoiler-span').click();
  await expect(page.locator('spoiler-span')).toHaveClass(/revealed/);
  await expect(page.locator('.code-toolbar button')).toHaveCount(2);
  await expect(page.locator('.katex-display')).toBeVisible();
  await page.locator('.friend-link-card img').click();
  await expect(page.locator('#image-dialog')).toBeVisible();
  await page.locator('#image-dialog .close-dialog').click();
  await page.screenshot({ path: `test-results/${info.project.name}-article.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('all four practice types work', async ({ page }) => {
  await page.goto(route('/post/practice/'));
  const quizzes = page.locator('li.quiz');
  await expect(quizzes).toHaveCount(4);
  await quizzes.nth(0).locator('input').first().check();
  await quizzes.nth(0).getByRole('button', { name: '检查答案' }).click();
  await expect(quizzes.nth(0).locator('.quiz-result')).toHaveText('回答正确');
  await quizzes.nth(1).locator('input').nth(0).check();
  await quizzes.nth(1).locator('input').nth(1).check();
  await quizzes.nth(1).getByRole('button', { name: '检查答案' }).click();
  await expect(quizzes.nth(1).locator('.quiz-result')).toHaveText('回答正确');
  await quizzes.nth(2).locator('input').first().check();
  await quizzes.nth(2).getByRole('button', { name: '检查答案' }).click();
  await expect(quizzes.nth(2).locator('.quiz-result')).toHaveText('回答正确');
  await quizzes.nth(3).locator('input').fill('Markdown');
  await quizzes.nth(3).getByRole('button', { name: '检查答案' }).click();
  await expect(quizzes.nth(3).locator('.quiz-result')).toHaveText('回答正确');
});
test('diagrams render locally and stay inside the article', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(route('/post/diagrams/'));
  await expect(page.locator('.diagram-output svg')).toHaveCount(2, { timeout: 30_000 });
  await expect(page.locator('.diagram-error')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${info.project.name}-diagrams.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('pagination, translated article, fallback and archives are usable', async ({ page }) => {
  await page.goto(route('/posts/'));
  await page.getByRole('link', { name: '下一页', exact: true }).click();
  await expect(page.locator('.post-card')).toHaveCount(2);
  await page.goto(route('/en/post/hello-world/'));
  await expect(page.locator('#article-content')).toContainText(/Hello, I.m Linxi/);
  await page.goto(route('/en/post/astro-notes/'));
  await expect(page.locator('.translation-notice')).toBeVisible();
  await page.goto(route('/archives/'));
  await expect(page.locator('.archives a')).toHaveCount(7);
});
