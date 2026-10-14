const { test, expect } = require('@playwright/test');

test('game launches, abilities work, and pause resumes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');

  await expect(page.locator('#start')).toBeVisible();
  await page.locator('#start').click();

  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#sector')).toHaveText('SECTOR 01');

  // Dashing should start its cooldown.
  await page.keyboard.press('Space');
  await expect(page.locator('#dash')).toHaveText(/DASH · [1-3]s/);

  // Nova should consume the starting charge.
  await page.keyboard.press('x');
  await expect(page.locator('#nova')).toHaveText('NOVA · 0');

  // Pause and resume should both work.
  await page.locator('#pause').click();
  await expect(page.locator('#resume')).toBeVisible();

  await page.locator('#resume').click();
  await expect(page.locator('#overlay')).toBeHidden();

  expect(errors).toEqual([]);
});