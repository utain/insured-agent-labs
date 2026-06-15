import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import type { LeadInput } from '../fixtures/data';

/** The "new lead" form (`/leads/new`). Only name/dob/gender are required. */
export class LeadFormPage extends BasePage {
	readonly fullNameInput: Locator;
	readonly dobInput: Locator;
	readonly occupationInput: Locator;
	readonly submitButton: Locator;

	constructor(page: Page) {
		super(page);
		this.fullNameInput = page.getByTestId('lead-full-name-input');
		this.dobInput = page.getByTestId('lead-dob-input');
		this.occupationInput = page.getByTestId('lead-occupation-input');
		this.submitButton = page.getByTestId('lead-submit-button');
	}

	/** Pick a gender via the modern radio control. */
	gender(value: string): Locator {
		return this.page.getByTestId(`lead-gender-${value}`);
	}

	async fill(lead: LeadInput): Promise<void> {
		await this.fillHydrated(this.fullNameInput, lead.full_name);
		await this.fillHydrated(this.dobInput, lead.dob);
		await this.gender(lead.gender).click();
		if (lead.occupation) await this.fillHydrated(this.occupationInput, lead.occupation);
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
	}
}
