import { expect, type Page, type Locator } from '@playwright/test';

/**
 * Base class shared by every Page Object. Holds the Playwright `page` handle and
 * a hydration-safe fill for Svelte controlled inputs.
 */
export abstract class BasePage {
	constructor(protected readonly page: Page) {}

	/**
	 * Fill a Svelte **controlled** input robustly. On hydration Svelte re-applies
	 * `value={state}` and can wipe a pre-hydration fill; we re-fill until the value
	 * survives a settle window (converges in 1–2 iterations).
	 */
	protected async fillHydrated(locator: Locator, value: string): Promise<void> {
		await expect(async () => {
			await locator.fill(value);
			await expect(locator).toHaveValue(value);
			await this.page.waitForTimeout(300);
			await expect(locator).toHaveValue(value);
		}).toPass({ timeout: 15_000, intervals: [200, 400, 600, 800] });
	}
}
