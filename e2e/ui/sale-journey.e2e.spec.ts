import { test, expect, resetState } from '../fixtures/api';
import { uiLogin, fillHydrated } from '../fixtures/ui';
import { USERS, randomThaiNationalId } from '../fixtures/data';

// Spec: docs/requirements/03-leads.md + 07-dashboard-transactions.md (UI surface)
test.describe('UI · sale journey', () => {
  test.beforeEach(async ({ api }) => {
    await resetState(api);
  });

  // KNOWN BUG (frontend): the new-lead form template writes
  //   <input ... pattern="[0-9]{13}" />
  // but Svelte treats `{13}` as an interpolation expression, so the RENDERED
  // attribute is `pattern="[0-9]13"`. That regex matches a single digit followed
  // by a literal "13", so the browser's HTML5 validation rejects every real
  // 13-digit Thai national ID and silently blocks form submission (no POST is
  // sent). The backend accepts the same data fine (proven by the API suite).
  // Fix: `pattern="[0-9]{'{'}13{'}'}"` or bind it: `pattern={'[0-9]{13}'}`.
  // Tracked in docs/ROADMAP.md.
  test('[current behavior] new-lead form national_id pattern is malformed and blocks submit', async ({
    page
  }) => {
    await uiLogin(page, USERS.standard);
    await page.getByTestId('dashboard-new-lead').click();
    await expect(page).toHaveURL(/\/leads\/new/);

    const nid = page.getByTestId('lead-national-id-input');
    await fillHydrated(nid, randomThaiNationalId()); // a checksum-valid 13-digit ID

    // The rendered pattern is the broken `[0-9]13`, so a valid ID is HTML5-invalid.
    await expect(nid).toHaveAttribute('pattern', '[0-9]13');
    const fieldValid = await nid.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(fieldValid).toBe(false);

    // Submitting does nothing (browser blocks it); we stay on the form.
    await page.getByTestId('lead-submit-button').click();
    await expect(page).toHaveURL(/\/leads\/new/);
  });

  test.fixme(
    '[intended] agent creates a lead via the UI and sees it on the dashboard',
    async ({ page }) => {
      await uiLogin(page, USERS.standard);
      await page.getByTestId('dashboard-new-lead').click();
      await expect(page).toHaveURL(/\/leads\/new/);

      await fillHydrated(page.getByTestId('lead-full-name-input'), 'Playwright Buyer');
      await fillHydrated(page.getByTestId('lead-national-id-input'), randomThaiNationalId());
      await fillHydrated(page.getByTestId('lead-dob-input'), '1990-01-01');
      await page.getByTestId('lead-gender-select').selectOption('male');
      await fillHydrated(page.getByTestId('lead-phone-input'), '0812345678');
      await fillHydrated(page.getByTestId('lead-email-input'), 'buyer@example.com');
      await page.getByTestId('lead-submit-button').click();

      // On success the form redirects to the new lead's detail page.
      await expect(page).toHaveURL(/\/leads\/[0-9a-f-]{36}$/);

      await page.goto('/en');
      await expect(page.getByTestId('dashboard-table')).toBeVisible();
      await expect(
        page.getByTestId('dashboard-row').filter({ hasText: 'Playwright Buyer' })
      ).toBeVisible();
    }
  );
});
