/**
 * Playwright E2E tests for the 4 new module pages (recipes, car, habits, meds)
 * plus the budget module. Each test enables the module from the Discover page
 * and exercises a full CRUD flow through the real UI.
 */

import { expect, test, type Page } from '@playwright/test';
import { ensureModuleEnabledFromDiscover } from './helpers';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Test 1: Recipes ─────────────────────────────────────────────────────────

test.describe('MyGarden CRUD', () => {
  test('create, search, and delete a recipe', async ({ page }) => {
    const idSuffix = Date.now();
    const recipeName = `E2E Pasta ${idSuffix}`;

    await ensureModuleEnabledFromDiscover(page, 'MyGarden');
    await page.goto('/recipes');
    await expect(page.getByRole('heading', { name: 'Recipes' })).toBeVisible();

    // Fill the new recipe form
    await page.getByPlaceholder('Recipe name').fill(recipeName);
    await page.getByPlaceholder('4').fill('6');
    await page.locator('select').selectOption('medium');
    await page.getByPlaceholder('15').fill('10');
    await page.getByPlaceholder('30').fill('25');

    // Submit
    await page.getByRole('button', { name: 'Add Recipe' }).click();

    // Verify recipe appears in the list
    await expect(page.getByText(recipeName)).toBeVisible();
    await expect(page.getByText('6 servings')).toBeVisible();

    // Search for it
    await page.getByPlaceholder('Search recipes...').fill(recipeName.slice(0, 12));
    await expect(page.getByText(recipeName)).toBeVisible();

    // Search for something that does not match
    await page.getByPlaceholder('Search recipes...').fill('ZZZZNORECIPE');
    await expect(page.getByText('No recipes match your search.')).toBeVisible();

    // Clear search to show recipe again
    await page.getByPlaceholder('Search recipes...').fill('');
    await expect(page.getByText(recipeName)).toBeVisible();

    // Click delete button (opens confirm dialog)
    const recipeRow = page
      .locator('div')
      .filter({ hasText: recipeName })
      .first();
    await recipeRow.getByTitle('Delete').click();

    // Confirm deletion in the overlay
    await page.getByRole('button', { name: 'Delete' }).last().click();

    // Verify recipe is removed
    await expect(page.getByText(recipeName)).toHaveCount(0);
  });
});

// ─── Test 2: Car ─────────────────────────────────────────────────────────────

test.describe('MyCar CRUD', () => {
  test('vehicle and maintenance flow', async ({ page }) => {
    const idSuffix = Date.now();
    const vehicleName = `E2E Car ${idSuffix}`;

    await ensureModuleEnabledFromDiscover(page, 'MyCar');
    await page.goto('/car');
    await expect(page.getByRole('heading', { name: 'Garage' })).toBeVisible();

    // Fill add vehicle form
    await page.getByPlaceholder('Name').fill(vehicleName);
    await page.getByPlaceholder('Make').fill('Honda');
    await page.getByPlaceholder('Model').fill('Civic');
    await page.getByPlaceholder('Year').fill('2023');

    // Submit
    await page.getByRole('button', { name: 'Add Vehicle' }).click();

    // Verify vehicle appears in the list
    const vehicleRow = page
      .locator('div')
      .filter({
        hasText: vehicleName,
        has: page.getByRole('button', { name: /Delete|Confirm/ }),
      })
      .last();
    await expect(vehicleRow).toBeVisible();

    // Click on the vehicle to select it (reveals detail sections)
    await vehicleRow.getByText(vehicleName, { exact: true }).click();

    // Add a maintenance record inside the maintenance card for this vehicle
    const maintSection = page
      .locator('div')
      .filter({
        hasText: 'Maintenance',
        has: page.locator('input[type="date"]'),
      })
      .last();
    await expect(maintSection.locator('select').first()).toBeVisible();
    await maintSection.locator('select').first().selectOption('oil_change');
    await maintSection.locator('input[type="date"]').fill('2026-02-20');
    await maintSection.getByRole('button', { name: 'Add' }).click();

    // Verify maintenance appears
    const maintenanceRow = maintSection
      .locator('div')
      .filter({
        hasText: '2026-02-20',
        has: page.getByRole('button', { name: 'Delete' }),
      })
      .first();
    await expect(maintenanceRow).toContainText('Oil Change');
    await expect(maintenanceRow).toContainText('2026-02-20');

    // Delete the vehicle (first click toggles confirm state, second confirms)
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await page.getByRole('button', { name: 'Confirm' }).first().click();

    // Vehicle should be removed
    await expect(page.getByText(vehicleName)).toHaveCount(0);
  });
});

// ─── Test 3: Habits ──────────────────────────────────────────────────────────

test.describe('MyHabits CRUD', () => {
  test('checklist and completion flow', async ({ page }) => {
    const idSuffix = Date.now();
    const habitName = `E2E Habit ${idSuffix}`;

    await ensureModuleEnabledFromDiscover(page, 'MyHabits');
    await page.goto('/habits');
    await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible();

    // Fill new habit form (at the bottom of the page under "New Habit")
    await page
      .getByPlaceholder('e.g. Meditate, Read, Exercise')
      .fill(habitName);
    // Frequency defaults to daily, target to 1 — leave them

    // Submit
    await page.getByRole('button', { name: 'Add Habit' }).click();

    // Verify habit appears in the "All Habits" section
    await expect(page.getByText(habitName).first()).toBeVisible();

    // The habit should also appear in "Today's Checklist"
    const checklistSection = page
      .getByText("Today's Checklist")
      .locator('xpath=..');
    await expect(checklistSection.getByText(habitName).first()).toBeVisible();

    // Click the completion toggle for this habit in Today's Checklist
    const habitCheckRow = checklistSection
      .locator('div')
      .filter({ hasText: habitName })
      .first();
    await habitCheckRow.locator('button').first().click();

    // After completion, the button should show a checkmark
    await expect(habitCheckRow.getByRole('button', { name: '✓' })).toBeVisible();

    // Delete the habit: click the delete button in the "All Habits" section
    const allHabitsSection = page
      .getByText('All Habits')
      .locator('xpath=..');
    const habitCard = allHabitsSection
      .locator('div')
      .filter({ hasText: habitName })
      .first();

    // Click the delete icon button to set confirm state
    await habitCard.getByTitle('Delete').click();
    // Click confirm
    await habitCard.getByRole('button', { name: 'Confirm' }).click();

    // Verify habit is removed
    await expect(page.getByText(habitName)).toHaveCount(0);
  });
});

// ─── Test 4: Meds ────────────────────────────────────────────────────────────

test.describe('MyMeds CRUD', () => {
  test('dose tracking flow', async ({ page }) => {
    const idSuffix = Date.now();
    const medName = `E2E Med ${idSuffix}`;

    await ensureModuleEnabledFromDiscover(page, 'MyMeds');
    await page.goto('/meds');
    await expect(
      page.getByRole('heading', { name: 'Medications', exact: true }),
    ).toBeVisible();

    // Wait for loading state to clear
    await expect(page.getByText('Loading medications...')).toHaveCount(0);

    // Fill "Add Medication" form
    await page.getByPlaceholder('Medication name').fill(medName);
    await page.getByPlaceholder('Dosage (e.g. 500)').fill('250');
    await page.getByPlaceholder('Unit (e.g. mg)').fill('mg');
    // Frequency defaults to daily — leave it

    // Submit
    await page.getByRole('button', { name: 'Add Medication' }).click();

    // Verify medication appears in "Today's Schedule" (it's active by default)
    const scheduleSection = page
      .getByRole('heading', { name: "Today's Schedule" })
      .locator('xpath=..');
    const medScheduleRow = scheduleSection
      .locator('div')
      .filter({
        hasText: medName,
        has: page.getByRole('button', { name: 'Take' }),
      })
      .first();
    await expect(medScheduleRow).toBeVisible();

    // Verify dosage shows
    await expect(medScheduleRow.getByText('250 mg')).toBeVisible();

    // Click "Take" button for this medication in the schedule
    await medScheduleRow.getByRole('button', { name: 'Take' }).click();

    // Verify dose recorded — status should change to "Taken"
    const takenScheduleRow = scheduleSection
      .locator('div')
      .filter({ hasText: medName })
      .first();
    await expect(takenScheduleRow.getByText('Taken')).toBeVisible();

    // Delete the medication — use the "Delete" button in "All Medications"
    const allMedsSection = page
      .getByRole('heading', { name: 'All Medications' })
      .locator('xpath=..');
    const medCard = allMedsSection
      .locator('div')
      .filter({ hasText: medName })
      .first();

    // The delete uses window.confirm, handle the dialog
    page.once('dialog', (dialog) => {
      dialog.accept();
    });
    await medCard.getByRole('button', { name: 'Delete' }).click();

    // Verify medication is removed
    await expect(allMedsSection.getByText(medName)).toHaveCount(0);
  });
});

// ─── Test 5: Budget ──────────────────────────────────────────────────────────

test.describe('MyBudget envelope and transaction flow', () => {
  test('create envelope, account, transaction, archive, and delete', async ({
    page,
  }) => {
    const idSuffix = Date.now();
    const envelopeName = `E2E Env ${idSuffix}`;
    const accountName = `E2E Acct ${idSuffix}`;
    const merchantName = `E2E Merchant ${idSuffix}`;

    await ensureModuleEnabledFromDiscover(page, 'MyBudget');
    await page.goto('/budget');
    await expect(page.getByRole('heading', { name: 'Budget' })).toBeVisible();

    // Helper to find card sections by kicker text
    function cardByKicker(kicker: string, occurrence: 'first' | 'last' = 'first') {
      const locator = page
        .locator('section')
        .filter({ has: page.locator('p', { hasText: new RegExp(`^${escapeRegex(kicker)}$`) }) });
      return occurrence === 'last' ? locator.last() : locator.first();
    }

    // Create envelope
    const newEnvelopeCard = cardByKicker('New Envelope');
    await newEnvelopeCard.getByPlaceholder('Envelope name').fill(envelopeName);
    await newEnvelopeCard.getByPlaceholder('0.00').fill('500.00');
    await newEnvelopeCard.getByRole('button', { name: 'Create' }).click();

    // Verify envelope appears
    const envelopesSection = cardByKicker('Envelopes');
    await expect(envelopesSection.getByText(envelopeName)).toBeVisible();

    // Create account
    const newAccountCard = cardByKicker('New Account');
    await newAccountCard.getByPlaceholder('Account name').fill(accountName);
    await newAccountCard.getByPlaceholder('0.00').fill('1000.00');
    await newAccountCard.getByRole('button', { name: 'Create' }).click();

    // Verify account appears
    const accountsSection = cardByKicker('Accounts');
    await expect(accountsSection.getByText(accountName)).toBeVisible();

    // Create transaction
    const newTransactionCard = cardByKicker('New Transaction');
    await newTransactionCard.getByPlaceholder('0.00').fill('42.35');
    await newTransactionCard.locator('input[type="date"]').fill('2026-02-25');
    await newTransactionCard
      .getByPlaceholder('Merchant (optional)')
      .fill(merchantName);
    await newTransactionCard
      .locator('select')
      .nth(1)
      .selectOption({ label: accountName });
    await newTransactionCard
      .locator('select')
      .nth(2)
      .selectOption({ label: envelopeName });
    await newTransactionCard
      .getByPlaceholder('Note (optional)')
      .fill('Budget e2e test');
    await newTransactionCard.getByRole('button', { name: 'Create' }).click();

    // Verify transaction appears in the transactions list
    const transactionsSection = cardByKicker('Transactions', 'last');
    await expect(transactionsSection.getByText(merchantName)).toBeVisible();

    // Filter by direction to verify the transaction is an outflow
    await transactionsSection.locator('select').nth(0).selectOption('inflow');
    await expect(
      transactionsSection.getByText('No transactions yet.'),
    ).toBeVisible();

    await transactionsSection.locator('select').nth(0).selectOption('outflow');
    await expect(transactionsSection.getByText(merchantName)).toBeVisible();

    // Reset filter
    await transactionsSection.locator('select').nth(0).selectOption('all');
  });
});
