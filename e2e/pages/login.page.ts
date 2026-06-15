import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { DEMO_PASSWORD } from '../fixtures/env';

/** The login screen (`/login`). */
export class LoginPage extends BasePage {
	readonly usernameInput: Locator;
	readonly passwordInput: Locator;
	readonly submitButton: Locator;
	readonly errorAlert: Locator;

	constructor(page: Page) {
		super(page);
		this.usernameInput = page.getByTestId('login-username-input');
		this.passwordInput = page.getByTestId('login-password-input');
		this.submitButton = page.getByTestId('login-submit-button');
		this.errorAlert = page.getByTestId('login-error-alert');
	}

	async goto(): Promise<void> {
		await this.page.goto('/login');
	}

	/** Fill credentials and submit, without asserting the result (for unhappy paths). */
	async submit(username: string, password: string = DEMO_PASSWORD): Promise<void> {
		await this.fillHydrated(this.usernameInput, username);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}

	/** Happy-path login: open, submit, and wait for redirect away from /login. */
	async login(username: string, password: string = DEMO_PASSWORD): Promise<void> {
		await this.goto();
		await this.submit(username, password);
		await this.page.waitForURL((url) => !url.pathname.includes('/login'));
	}
}
