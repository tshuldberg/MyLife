import { expect, test } from '@playwright/test';
import { ensureModuleEnabledFromDiscover } from './helpers';

test.describe('Hub and Settings', () => {
  test('buttons navigate to expected pages and persist mode changes', async ({ page }) => {
    await ensureModuleEnabledFromDiscover(page, 'MyBooks');

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(/module active|modules active/i)).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);

    await page.getByRole('link', { name: 'Upgrade' }).click();
    await expect(page).toHaveURL(/\/discover$/);

    await page.goto('/onboarding/mode');
    await page.getByPlaceholder('https://home.example.com').fill('https://example.invalid');
    await page.getByRole('button', { name: 'Use Self-Host' }).click();
    await expect(page).toHaveURL('/');

    await page.goto('/settings');
    await expect(page.getByText('SELF HOST')).toBeVisible();
    await expect(page.getByText('Server: https://example.invalid')).toBeVisible();

    await page.getByRole('link', { name: 'Open Self-Host Setup' }).click();
    await expect(page).toHaveURL('/settings/self-host');

    const serverUrlInput = page.getByLabel('Server URL');
    await expect(serverUrlInput).toHaveValue(/https?:\/\//);
    await serverUrlInput.fill('http://127.0.0.1:1');
    await expect(serverUrlInput).toHaveValue('http://127.0.0.1:1');
    await page.getByRole('button', { name: 'Test Connection' }).click();
    await expect(page.getByText('Overall: FAIL')).toBeVisible();
    await expect(
      page.getByText(
        'Health endpoint is unreachable. Check DNS, firewall, and server port mapping.',
      ),
    ).toBeVisible();

    await page.getByLabel('Server URL').fill('https://selfhost.example.com');
    await page.getByRole('button', { name: 'Save and Use Self-Host' }).click();
    await expect(page.getByText('Saved self-host mode and server URL.')).toBeVisible();

    await page.goto('/settings');
    await expect(page.getByText('Server: https://selfhost.example.com')).toBeVisible();
  });
});
