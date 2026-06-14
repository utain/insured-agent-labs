import { test, expect, login, bearer, backendContext } from '../fixtures/api';
import { USERS, PRODUCTS, validLead } from '../fixtures/data';

// Spec: docs/requirements/04-quotations.md
test.describe('API · quotations', () => {
  let token: string;

  test.beforeAll(async () => {
    const ctx = await backendContext();
    token = await login(ctx, USERS.standard);
    await ctx.dispose();
  });

  async function newLeadId(api: import('@playwright/test').APIRequestContext): Promise<string> {
    const res = await api.post('/api/leads', { headers: bearer(token), data: validLead() });
    expect(res.status()).toBe(201);
    return (await res.json()).id;
  }

  test('create draft quotation sets the source lead to "quoted"', async ({ api }) => {
    const leadId = await newLeadId(api);
    const res = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: PRODUCTS.term }
    });
    expect(res.status()).toBe(201);
    const q = await res.json();
    expect(q.status).toBe('draft');
    expect(q.base_product_code).toBe(PRODUCTS.term);

    const lead = await api.get(`/api/leads/${leadId}`, { headers: bearer(token) });
    expect((await lead.json()).status).toBe('quoted');
  });

  test('create with unknown lead or product → 404', async ({ api }) => {
    const badLead = await api.post('/api/quotations', {
      headers: bearer(token),
      data: {
        lead_id: '00000000-0000-0000-0000-000000000000',
        base_product_code: PRODUCTS.term
      }
    });
    expect(badLead.status()).toBe(404);

    const leadId = await newLeadId(api);
    const badProduct = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: 'NOPE' }
    });
    expect(badProduct.status()).toBe(404);
  });

  test('update rejects out-of-bounds values (422) without persisting', async ({ api }) => {
    const leadId = await newLeadId(api);
    const created = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: PRODUCTS.term }
    });
    const id = (await created.json()).id;

    const res = await api.put(`/api/quotations/${id}`, {
      headers: bearer(token),
      data: { sum_assured: 50, term: 7, modal: 'annual', riders: [] } // both out of bounds
    });
    expect(res.status()).toBe(422);

    // stored quotation is unchanged (still has no calc)
    const get = await api.get(`/api/quotations/${id}`, { headers: bearer(token) });
    expect((await get.json()).calc).toBeNull();
  });

  test('update recomputes premium and finalize sets valid_until (+30d)', async ({ api }) => {
    const leadId = await newLeadId(api);
    const created = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: PRODUCTS.term }
    });
    const id = (await created.json()).id;

    const upd = await api.put(`/api/quotations/${id}`, {
      headers: bearer(token),
      data: { sum_assured: 1_000_000, term: 20, modal: 'annual', riders: [] }
    });
    expect(upd.status()).toBe(200);
    const calc = (await upd.json()).calc;
    expect(calc.base_premium).toBeGreaterThan(0);
    expect(calc.total_annual_premium).toBeCloseTo(calc.base_premium, 2); // no riders

    const fin = await api.post(`/api/quotations/${id}/finalize`, { headers: bearer(token) });
    expect(fin.status()).toBe(200);
    const q = await fin.json();
    expect(q.status).toBe('quoted');
    const days = (new Date(q.valid_until).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);

    // finalizing again conflicts
    const again = await api.post(`/api/quotations/${id}/finalize`, { headers: bearer(token) });
    expect(again.status()).toBe(409);
  });

  test('calculate previews premium without persisting', async ({ api }) => {
    const leadId = await newLeadId(api);
    const created = await api.post('/api/quotations', {
      headers: bearer(token),
      data: { lead_id: leadId, base_product_code: PRODUCTS.term }
    });
    const id = (await created.json()).id;
    await api.put(`/api/quotations/${id}`, {
      headers: bearer(token),
      data: { sum_assured: 500_000, term: 10, modal: 'monthly', riders: [] }
    });

    const calc = await api.post(`/api/quotations/${id}/calculate`, { headers: bearer(token) });
    expect(calc.status()).toBe(200);
    const body = await calc.json();
    // monthly modal factor is 0.09 of the annual total
    expect(body.modal_premium).toBeCloseTo(body.total_annual_premium * 0.09, 1);
  });
});
