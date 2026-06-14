import { test, expect, resetState } from '../fixtures/api';
import { uiLogin, fillHydrated } from '../fixtures/ui';
import { USERS } from '../fixtures/data';

// Spec: docs/requirements/07-dashboard-transactions.md (UI surface)
test.describe('UI · dashboard', () => {
  // Reset backend to seed state so the seeded transaction feed is deterministic.
  test.beforeEach(async ({ api }) => {
    await resetState(api);
  });

  test('shows the seeded transaction feed', async ({ page }) => {
    await uiLogin(page, USERS.standard);
    await expect(page.getByTestId('dashboard-table')).toBeVisible();
    await expect(page.getByTestId('dashboard-row')).toHaveCount(6);
  });

  test('search filter narrows results and clear restores them', async ({ page }) => {
    await uiLogin(page, USERS.standard);

    await fillHydrated(page.getByTestId('dashboard-filter-search'), 'Quotation');
    await page.getByTestId('dashboard-filter-apply').click();
    await expect(page).toHaveURL(/search=Quotation/);
    await expect(page.getByTestId('dashboard-row')).toHaveCount(2);

    await page.getByTestId('dashboard-filter-clear').click();
    await expect(page.getByTestId('dashboard-row')).toHaveCount(6);
  });
});
