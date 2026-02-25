import { expect, test } from '@playwright/test';
import { ensureModuleEnabledFromDiscover } from './helpers';

test.describe('MyBooks user flows', () => {
  test('search/add, page navigation, social actions, and stats all work', async ({ page }) => {
    const idSuffix = Date.now();
    const title = `E2E Search Book ${idSuffix}`;
    const author = 'E2E Author';

    await ensureModuleEnabledFromDiscover(page, 'MyBooks');

    await page.route('https://openlibrary.org/search.json**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          docs: [
            {
              key: `/works/OL${idSuffix}W`,
              title,
              author_name: [author],
              cover_edition_key: `OL${idSuffix}M`,
              first_publish_year: 2020,
              isbn: ['1234567890', '1234567890123'],
              number_of_pages_median: 321,
            },
          ],
        }),
      });
    });

    await page.goto('/books/search');
    await page
      .getByPlaceholder('Search by title, author, or ISBN...')
      .fill(`e2e-${idSuffix}`);
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText(title)).toBeVisible();
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.getByRole('button', { name: 'Added' })).toBeDisabled();

    await page.goto('/books');
    await expect(page.getByText(title)).toBeVisible();

    await page.getByRole('button', { name: 'Want to Read' }).click();
    await expect(page.getByText(title)).toBeVisible();

    await page.getByRole('button', { name: 'List' }).click();
    await expect(page.getByRole('button', { name: 'Grid' })).toBeVisible();

    await page.getByRole('link', { name: title }).first().click();
    await expect(page).toHaveURL(/\/books\/.+/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.getByRole('button', { name: /^Share / }).click();
    await expect(page.getByText(/Shared \(friends\) as event/)).toBeVisible();
    await expect(page.getByText(/demo-alice shared generic \(friends\)/)).toBeVisible();

    await page.getByRole('button', { name: 'Send Invite' }).click();
    await expect(page.getByText(/Invite sent from demo-alice to demo-bob/)).toBeVisible();

    const actorUserIdInput = page.getByLabel('Your User ID');
    await actorUserIdInput.fill('demo-bob');
    const incomingInvitesSection = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Incoming Invites' }) })
      .first();
    await expect(
      incomingInvitesSection.getByRole('button', { name: 'Accept' }),
    ).toBeVisible();
    await incomingInvitesSection.getByRole('button', { name: 'Accept' }).click();
    await expect(page.getByText('Invite accepted.')).toBeVisible();
    await expect(page.getByText(/• accepted/)).toBeVisible();

    await page.goto('/books/stats');
    await expect(page.getByRole('heading', { name: 'Reading Stats' })).toBeVisible();
    await expect(page.getByText('Total Books')).toBeVisible();
    await expect(page.getByText('DNF')).toBeVisible();
  });

  test('csv import button flow populates library data', async ({ page }) => {
    const idSuffix = Date.now();
    const importedTitle = `E2E Imported Book ${idSuffix}`;
    const csv = `Title,Authors\n${importedTitle},E2E Import Author\n`;

    await ensureModuleEnabledFromDiscover(page, 'MyBooks');

    await page.goto('/books/import');
    await page.getByRole('button', { name: 'StoryGraph' }).click();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'storygraph.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });

    await page.getByRole('button', { name: /Import from StoryGraph/i }).click();
    await expect(page.getByText('Results')).toBeVisible();
    await expect(page.getByText('Books imported')).toBeVisible();

    await page.goto('/books');
    await expect(page.getByText(importedTitle)).toBeVisible();
  });
});
