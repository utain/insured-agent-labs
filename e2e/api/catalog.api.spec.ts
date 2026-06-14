import { test, expect, login, bearer } from '../fixtures/api';
import { USERS, PRODUCTS } from '../fixtures/data';

// Spec: docs/requirements/02-catalog.md
test.describe('API · catalog', () => {
  let token: string;
  test.beforeAll(async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL ?? 'http://localhost:3000'
    });
    token = await login(ctx, USERS.standard);
    await ctx.dispose();
  });

  test('requires authentication', async ({ api }) => {
    const res = await api.get('/api/catalog/products');
    expect(res.status()).toBe(401);
  });

  test('lists the four seeded base products', async ({ api }) => {
    const res = await api.get('/api/catalog/products', { headers: bearer(token) });
    expect(res.status()).toBe(200);
    const products = await res.json();
    const codes = products.map((p: { code: string }) => p.code).sort();
    expect(codes).toEqual(
      [PRODUCTS.endow, PRODUCTS.term, PRODUCTS.ulip, PRODUCTS.whole].sort()
    );
  });

  test('gets a product by code; unknown code → 404', async ({ api }) => {
    const ok = await api.get(`/api/catalog/products/${PRODUCTS.term}`, {
      headers: bearer(token)
    });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).code).toBe(PRODUCTS.term);

    const missing = await api.get('/api/catalog/products/NOPE', { headers: bearer(token) });
    expect(missing.status()).toBe(404);
    expect((await missing.json()).error.code).toBe('not_found');
  });

  test('filters riders by type', async ({ api }) => {
    const res = await api.get('/api/catalog/riders', {
      headers: bearer(token),
      params: { type: 'ci' }
    });
    expect(res.status()).toBe(200);
    const riders = await res.json();
    expect(riders.length).toBeGreaterThan(0);
    expect(riders.every((r: { rider_type: string }) => r.rider_type === 'ci')).toBeTruthy();
  });

  test('unfiltered rider list returns all types', async ({ api }) => {
    const res = await api.get('/api/catalog/riders', { headers: bearer(token) });
    expect(res.status()).toBe(200);
    const types = new Set((await res.json()).map((r: { rider_type: string }) => r.rider_type));
    // health, ci, pa, tpd, wp
    expect(types.size).toBeGreaterThanOrEqual(5);
  });

  test('unknown rider code → 404', async ({ api }) => {
    const res = await api.get('/api/catalog/riders/NOPE', { headers: bearer(token) });
    expect(res.status()).toBe(404);
  });
});
