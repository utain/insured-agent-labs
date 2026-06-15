import { test as base } from './api';
import {
	LoginPage,
	DashboardPage,
	LeadFormPage,
	QuotationWizardPage,
	AppHeader
} from '../pages';

/** UI test harness: the API `test` extended with a Page/Component Object per screen. */
type PageObjects = {
	loginPage: LoginPage;
	dashboardPage: DashboardPage;
	leadFormPage: LeadFormPage;
	wizardPage: QuotationWizardPage;
	header: AppHeader;
};

export const test = base.extend<PageObjects>({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page));
	},
	dashboardPage: async ({ page }, use) => {
		await use(new DashboardPage(page));
	},
	leadFormPage: async ({ page }, use) => {
		await use(new LeadFormPage(page));
	},
	wizardPage: async ({ page }, use) => {
		await use(new QuotationWizardPage(page));
	},
	header: async ({ page }, use) => {
		await use(new AppHeader(page));
	}
});

export { expect, resetState, login } from './api';
