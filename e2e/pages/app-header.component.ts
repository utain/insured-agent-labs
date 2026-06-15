import { type Page, type Locator } from '@playwright/test';

/** Component Object for the persistent app header (user, scenario badge, logout). */
export class AppHeader {
	readonly root: Locator;
	readonly userName: Locator;
	readonly scenarioBadge: Locator;
	readonly logoutButton: Locator;
	readonly newQuotationLink: Locator;
	readonly resetButton: Locator;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('app-header');
		this.userName = page.getByTestId('header-user-name');
		this.scenarioBadge = page.getByTestId('header-scenario-badge');
		this.logoutButton = page.getByTestId('header-logout-button');
		this.newQuotationLink = page.getByTestId('nav-new-quotation');
		this.resetButton = page.getByTestId('reset-data-button');
	}

	async logout(): Promise<void> {
		await this.logoutButton.click();
	}
}
