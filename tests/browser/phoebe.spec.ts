import { test, expect } from '@playwright/test';
import { siteBase } from '../../src/lib/urls';

test('home hero title plays Phoebe audio and launches runners from every direction', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${siteBase}/`);
  const trigger = page.locator('#phoebe-trigger');
  await expect(trigger).toBeVisible();

  const audioRequest = page.waitForRequest('**/audio/phoebe-chubby/phoebe_0.mp3');
  await trigger.click();
  await audioRequest;

  const runners = page.locator('.phoebe-runner');
  const expectedCount = await page.evaluate(() => innerWidth <= 760 ? 4 : 6);
  await expect(runners).toHaveCount(expectedCount);
  await expect.poll(
    () => runners.evaluateAll((images) => new Set(images.map((image) => (image as HTMLElement).dataset.direction)).size),
  ).toBe(4);

  await page.waitForTimeout(700);
  await expect(runners.first()).toBeVisible();
  await page.screenshot({ path: `test-results/${info.project.name}-phoebe.png` });
  expect(errors).toEqual([]);
});
