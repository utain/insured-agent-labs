import {
	test as base,
	expect,
	request,
	type APIRequestContext,
	type APIResponse
} from '@playwright/test';
import { API_BASE_URL, DEMO_PASSWORD } from './env';
import { USERS, type LeadInput } from './data';

/**
 * Shared fixtures.
 *   - `api`           : an APIRequestContext bound to the app base URL.
 *   - `standardToken` : a fresh `agent.standard` session token, minted per test.
 */
type Fixtures = {
	api: APIRequestContext;
	standardToken: string;
};

export const test = base.extend<Fixtures>({
	api: async ({ playwright }, use) => {
		const ctx = await playwright.request.newContext({ baseURL: API_BASE_URL });
		await use(ctx);
		await ctx.dispose();
	},
	standardToken: async ({ api }, use) => {
		await use(await login(api, USERS.standard));
	}
});

export { expect };

/** Bearer auth header. */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Assert a response status and return its parsed JSON body (typed). */
export async function json<T = any>(res: APIResponse, status: number, label?: string): Promise<T> {
	const where = label ? `${label} — ` : '';
	expect(res.status(), `${where}${res.url()} → ${res.status()} (expected ${status})`).toBe(status);
	return (await res.json()) as T;
}

/** Log in and return the session token. Asserts success. */
export async function login(
	api: APIRequestContext,
	username: string,
	password: string = DEMO_PASSWORD
): Promise<string> {
	const res = await api.post('/api/auth/login', { data: { username, password } });
	expect(res.ok(), `login(${username}) → ${res.status()}`).toBeTruthy();
	const body = (await res.json()) as { token: string };
	return body.token;
}

/** Reset the store to seed state (open endpoint). Returns a fresh standard token. */
export async function resetState(api: APIRequestContext): Promise<string> {
	const res = await api.post('/api/admin/reset');
	expect(res.status(), 'admin reset').toBe(200);
	return login(api, USERS.standard);
}

/** Create a standalone request context (for beforeAll hooks). */
export async function backendContext(): Promise<APIRequestContext> {
	return request.newContext({ baseURL: API_BASE_URL });
}

/** Drive insured → plan + coverage → Sales Illustration. */
export async function createIllustration(
	api: APIRequestContext,
	token: string,
	opts: {
		insured?: Partial<LeadInput>;
		leadId?: string;
		product: string;
		sum_assured: number;
		term: number;
		modal?: 'annual' | 'semi' | 'quarterly' | 'monthly';
		riders?: { code: string; sum_assured: number }[];
	}
): Promise<{ quotationId: string; illustrationId: string }> {
	const createBody = opts.leadId
		? { lead_id: opts.leadId }
		: {
				insured: {
					full_name: 'Flow Insured',
					dob: '1990-01-01',
					gender: 'male' as const,
					...opts.insured
				}
			};

	const quotation = await json(
		await api.post('/api/quotations', { headers: bearer(token), data: createBody }),
		200,
		'create quotation'
	);
	const quotationId = quotation.id as string;

	await json(
		await api.put(`/api/quotations/${quotationId}`, {
			headers: bearer(token),
			data: {
				base_product_code: opts.product,
				sum_assured: opts.sum_assured,
				term: opts.term,
				modal: opts.modal ?? 'annual',
				riders: opts.riders ?? []
			}
		}),
		200,
		'update quotation'
	);

	const si = await json(
		await api.post(`/api/quotations/${quotationId}/illustrate`, { headers: bearer(token) }),
		200,
		'illustrate'
	);

	return { quotationId, illustrationId: si.id as string };
}
