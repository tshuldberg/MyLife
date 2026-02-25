import { expect, type Page } from '@playwright/test';

export async function ensureModuleEnabledFromDiscover(page: Page, moduleName: string) {
  await page.goto('/discover');

  const moduleCard = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: moduleName, exact: true }) })
    .first();
  await expect(moduleCard).toBeVisible();

  const toggle = moduleCard.getByRole('button').first();
  const label = (await toggle.innerText()).trim();
  if (label === 'Enable') {
    await toggle.click();
  }
  await expect(toggle).toHaveText('Enabled');
}
