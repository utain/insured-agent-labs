import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { API_BASE_URL, DEMO_PASSWORD } from './env';
import { USERS } from './data';

/**
 * Shared fixtures. The `api` fixture is an APIRequestContext bound to the Rust
 * BACKEND base URL — independent of a project's `baseURL` — so both API specs
 * and UI specs (which need to reset/seed backend state) can use it.
 */
type Fixtures = {
  api: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL: API_BASE_URL });
    await use(ctx);
    await ctx.dispose();
  }
});

export { expect };

/** Bearer auth header. */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

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

/**
 * Reset the backend to seed state (global). Returns a FRESH token for
 * agent.standard, since reset clears all sessions (including the one used to
 * authorize the reset).
 */
export async function resetState(api: APIRequestContext): Promise<string> {
  const adminToken = await login(api, USERS.standard);
  const res = await api.post('/api/admin/reset', { headers: bearer(adminToken) });
  expect(res.status(), 'admin reset').toBe(204);
  return login(api, USERS.standard);
}

/**
 * Create a standalone backend-bound request context (for use in `beforeAll`
 * hooks, which don't have access to test-scoped fixtures).
 */
export async function backendContext(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API_BASE_URL });
}

/** Drive a lead → draft quotation → finalized (quoted) quotation. */
export async function createFinalizedQuotation(
  api: APIRequestContext,
  token: string,
  opts: {
    lead: import('./data').LeadInput;
    product: string;
    sum_assured: number;
    term: number;
    modal?: 'annual' | 'semi' | 'quarterly' | 'monthly';
  }
): Promise<{ leadId: string; quotationId: string }> {
  const leadRes = await api.post('/api/leads', { headers: bearer(token), data: opts.lead });
  expect(leadRes.status(), 'create lead').toBe(201);
  const leadId = (await leadRes.json()).id as string;

  const qRes = await api.post('/api/quotations', {
    headers: bearer(token),
    data: { lead_id: leadId, base_product_code: opts.product }
  });
  expect(qRes.status(), 'create quotation').toBe(201);
  const quotationId = (await qRes.json()).id as string;

  const putRes = await api.put(`/api/quotations/${quotationId}`, {
    headers: bearer(token),
    data: {
      sum_assured: opts.sum_assured,
      term: opts.term,
      modal: opts.modal ?? 'annual',
      riders: []
    }
  });
  expect(putRes.status(), 'update quotation').toBe(200);

  const finalizeRes = await api.post(`/api/quotations/${quotationId}/finalize`, {
    headers: bearer(token)
  });
  expect(finalizeRes.status(), 'finalize quotation').toBe(200);

  return { leadId, quotationId };
}
