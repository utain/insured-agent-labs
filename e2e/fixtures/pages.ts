import { test as base, expect, mergeTests } from '@playwright/test';
import { test as apiTest } from './api';
import {
	LoginPage,
	DashboardPage,
	LeadFormPage,
	QuotationWizardPage,
	AppHeader
} from '../pages';

/** UI test harness: one Page/Component Object per screen, delivered as fixtures. */
type PageObjects = {
	loginPage: LoginPage;
	dashboardPage: DashboardPage;
	leadFormPage: LeadFormPage;
	wizardPage: QuotationWizardPage;
	header: AppHeader;
};

const pageObjects = base.extend<PageObjects>({
	loginPage: async ({ page }, use) => use(new LoginPage(page)),
	dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
	leadFormPage: async ({ page }, use) => use(new LeadFormPage(page)),
	wizardPage: async ({ page }, use) => use(new QuotationWizardPage(page)),
	header: async ({ page }, use) => use(new AppHeader(page))
});

/**
 * UI specs get the Page Objects *and* the API fixtures (`anon`, `agent`,
 * `loginAs`, `resetState`) — so a browser journey can seed/reset state over the
 * API. `mergeTests` composes the two independent fixture sets.
 */
export const test = mergeTests(apiTest, pageObjects);
export { expect };
