import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The quotation wizard: step 1 (`/quotations/new`) + steps 2/2.1 (`/quotations/[id]`). */
export class QuotationWizardPage extends BasePage {
	// Step 1
	readonly freshModeButton: Locator;
	readonly insuredName: Locator;
	readonly insuredDob: Locator;
	readonly createButton: Locator;
	// Step 2 / 2.1
	readonly recalculateButton: Locator;
	readonly premiumTotal: Locator;
	readonly confirmButton: Locator;

	constructor(page: Page) {
		super(page);
		this.freshModeButton = page.getByTestId('quotation-mode-fresh');
		this.insuredName = page.getByTestId('quotation-insured-name');
		this.insuredDob = page.getByTestId('quotation-insured-dob');
		this.createButton = page.getByTestId('quotation-create-button');
		this.recalculateButton = page.getByTestId('recalculate-button');
		this.premiumTotal = page.getByTestId('premium-total');
		this.confirmButton = page.getByTestId('confirm-illustration-button');
	}

	async goto(): Promise<void> {
		await this.page.goto('/quotations/new');
	}

	/** Step 1: start fresh with the given insured and continue to plan selection. */
	async startFresh(insured: { full_name: string; dob: string; gender: string }): Promise<void> {
		await this.freshModeButton.click();
		await this.fillHydrated(this.insuredName, insured.full_name);
		await this.fillHydrated(this.insuredDob, insured.dob);
		await this.page.getByTestId(`quotation-insured-gender-${insured.gender}`).click();
		await this.createButton.click();
		await this.page.waitForURL(/\/quotations\/[^/]+$/);
	}

	/** Step 2: pick a base life plan by product code. */
	async selectProduct(code: string): Promise<void> {
		await this.page.locator(`[data-testid="product-option"][data-code="${code}"]`).click();
	}
}
