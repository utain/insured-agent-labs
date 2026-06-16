import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { API_BASE_URL } from './env';
import { USERS } from './data';
import { AgentApi } from '../clients';

/**
 * API fixtures. A spec names what it needs and Playwright builds it:
 *   - `anon`       : an unauthenticated client (login, health, reset, 401 paths).
 *   - `agent`      : a client authenticated as `agent.standard`, minted per test.
 *   - `loginAs`    : factory for any other seeded role (locked/bug/glitch/error).
 *   - `resetState` : reset the store to seed, returning a fresh standard client.
 *                    Use this (not `agent`) in specs that assert exact store state —
 *                    `reset` re-seeds sessions, invalidating earlier tokens.
 */
export type ApiFixtures = {
	ctx: APIRequestContext;
	anon: AgentApi;
	agent: AgentApi;
	loginAs: (username: string, password?: string) => Promise<AgentApi>;
	resetState: () => Promise<AgentApi>;
};

export const test = base.extend<ApiFixtures>({
	ctx: async ({ playwright }, use) => {
		const ctx = await playwright.request.newContext({ baseURL: API_BASE_URL });
		await use(ctx);
		await ctx.dispose();
	},
	// `anon` gets its OWN request context. A login on the shared `ctx` leaves a
	// session cookie in that context's jar, and the server falls back to the cookie
	// when no bearer is present (hooks.server.ts) — so an `anon` sharing `ctx` would
	// stop being anonymous after any `agent`/`loginAs` in the same test.
	anon: async ({ playwright }, use) => {
		const ctx = await playwright.request.newContext({ baseURL: API_BASE_URL });
		await use(AgentApi.anonymous(ctx));
		await ctx.dispose();
	},
	agent: async ({ ctx }, use) => {
		await use(await AgentApi.loginAs(ctx, USERS.standard));
	},
	loginAs: async ({ ctx }, use) => {
		await use((username, password) => AgentApi.loginAs(ctx, username, password));
	},
	resetState: async ({ ctx }, use) => {
		await use(async () => {
			await AgentApi.anonymous(ctx).admin.reset();
			return AgentApi.loginAs(ctx, USERS.standard);
		});
	}
});

export { expect };
export { AgentApi, expectError } from '../clients';
