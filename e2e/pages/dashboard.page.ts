import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The agent dashboard (`/`). */
export class DashboardPage extends BasePage {
	readonly pageTitle: Locator;
	readonly table: Locator;
	readonly rows: Locator;
	readonly newQuotationButton: Locator;
	readonly empty: Locator;

	constructor(page: Page) {
		super(page);
		this.pageTitle = page.getByTestId('dashboard-page-title');
		this.table = page.getByTestId('dashboard-table');
		this.rows = page.getByTestId('dashboard-row');
		this.newQuotationButton = page.getByTestId('dashboard-new-quotation');
		this.empty = page.getByTestId('dashboard-empty');
	}

	async goto(): Promise<void> {
		await this.page.goto('/');
	}
}
