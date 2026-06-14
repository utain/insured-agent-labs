import { test, expect, login, bearer } from '../fixtures/api';
import { USERS, PRODUCTS, validLead } from '../fixtures/data';
import type { APIRequestContext } from '@playwright/test';

// Spec: docs/requirements/10-scenarios-test-data.md
//
// These tests exercise the deterministic scenario behaviors that are actually
// implemented in the backend today (locked / bug / glitch / error). Each agent
// owns its own data, so no global reset is needed.

/** Create a draft quotation with fixed params and return its id. */
async function draftQuote(api: APIRequestContext, token: string): Promise<string> {
  const leadRes = await api.post('/api/leads', {
    headers: bearer(token),
    // Fixed DOB so insured_age (and thus the rate) is identical across agents.
    data: validLead({ dob: '1985-06-15' })
  });
  const leadId = (await leadRes.json()).id;
  const qRes = await api.post('/api/quotations', {
    headers: bearer(token),
    data: { lead_id: leadId, base_product_code: PRODUCTS.term }
  });
  const id = (await qRes.json()).id;
  await api.put(`/api/quotations/${id}`, {
    headers: bearer(token),
    data: { sum_assured: 1_000_000, term: 20, modal: 'annual', riders: [] }
  });
  return id;
}

test.describe('API · scenarios', () => {
  test('locked: login is rejected with 423', async ({ api }) => {
    const res = await api.post('/api/auth/login', {
      data: { username: USERS.locked, password: 'insure_demo' }
    });
    expect(res.status()).toBe(423);
  });

  test('bug: base premium is inflated ~5% vs. standard for identical inputs', async ({ api }) => {
    const stdToken = await login(api, USERS.standard);
    const bugToken = await login(api, USERS.bug);

    const stdId = await draftQuote(api, stdToken);
    const bugId = await draftQuote(api, bugToken);

    const stdCalc = await (
      await api.post(`/api/quotations/${stdId}/calculate`, { headers: bearer(stdToken) })
    ).json();
    const bugCalc = await (
      await api.post(`/api/quotations/${bugId}/calculate`, { headers: bearer(bugToken) })
    ).json();

    expect(stdCalc.base_premium).toBeGreaterThan(0);
    const ratio = bugCalc.base_premium / stdCalc.base_premium;
    expect(ratio).toBeCloseTo(1.05, 2);
  });

  test('glitch: calculate is delayed ~3s', async ({ api }) => {
    const token = await login(api, USERS.glitch);
    const id = await draftQuote(api, token);

    const start = Date.now();
    const res = await api.post(`/api/quotations/${id}/calculate`, { headers: bearer(token) });
    const elapsed = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(2_900);
    expect(elapsed).toBeLessThan(10_000);
  });

  test('error: finalize returns 500 and leaves the quotation in draft', async ({ api }) => {
    const token = await login(api, USERS.error);
    const id = await draftQuote(api, token);

    const fin = await api.post(`/api/quotations/${id}/finalize`, { headers: bearer(token) });
    expect(fin.status()).toBe(500);
    expect((await fin.json()).error.code).toBe('server_error');

    const get = await api.get(`/api/quotations/${id}`, { headers: bearer(token) });
    expect((await get.json()).status).toBe('draft');
  });
});
