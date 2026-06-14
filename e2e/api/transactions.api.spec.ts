import {
  test,
  expect,
  login,
  bearer,
  backendContext,
  resetState,
  createFinalizedQuotation
} from '../fixtures/api';
import { USERS, PRODUCTS, validLead } from '../fixtures/data';

// Spec: docs/requirements/07-dashboard-transactions.md
test.describe('API · transactions (dashboard feed)', () => {
  let token: string;

  // Reset so counts/filters are deterministic, then build one full journey.
  test.beforeAll(async () => {
    const ctx = await backendContext();
    token = await resetState(ctx);
    await createFinalizedQuotation(ctx, token, {
      lead: validLead({ full_name: 'Feed Journey' }),
      product: PRODUCTS.term,
      sum_assured: 1_000_000,
      term: 20
    });
    await ctx.dispose();
  });

  test('returns a paginated envelope scoped to the caller', async ({ api }) => {
    const res = await api.get('/api/transactions', { headers: bearer(token) });
    expect(res.status()).toBe(200);
    const page = await res.json();
    expect(page).toMatchObject({ page: 1 });
    expect(Array.isArray(page.items)).toBeTruthy();
    expect(typeof page.total).toBe('number');
    expect(page.items.length).toBeGreaterThan(0);
  });

  // KNOWN BUG (backend): the `kind` and `status` filters are typed as Vec<_> but
  // the handler uses axum's default `Query` extractor (serde_urlencoded), which
  // cannot deserialize sequences from the query string — so ANY `kind=`/`status=`
  // returns 400 instead of filtering. Same defect affects GET /api/quotations
  // ?status=. The dashboard sidesteps it by filtering via `search`. Fix: switch
  // these handlers to `axum_extra::extract::Query`. Tracked in docs/ROADMAP.md.
  test('[current behavior] kind filter returns 400 (serde_urlencoded Vec limitation)', async ({
    api
  }) => {
    const res = await api.get('/api/transactions', {
      headers: bearer(token),
      params: { kind: 'quotation' }
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toContain('expected a sequence');
  });

  test.fixme('[intended] filters by kind once the Vec query bug is fixed', async ({ api }) => {
    const res = await api.get('/api/transactions', {
      headers: bearer(token),
      params: { kind: 'quotation' }
    });
    const page = await res.json();
    expect(page.items.every((t: { kind: string }) => t.kind === 'quotation')).toBeTruthy();
    expect(page.items.length).toBeGreaterThan(0);
  });

  test('search matches title/summary case-insensitively', async ({ api }) => {
    const res = await api.get('/api/transactions', {
      headers: bearer(token),
      params: { search: 'feed journey' }
    });
    const page = await res.json();
    expect(page.total).toBeGreaterThan(0);
  });

  test('clamps page_size to [1,100]', async ({ api }) => {
    const res = await api.get('/api/transactions', {
      headers: bearer(token),
      params: { page_size: '9999' }
    });
    const page = await res.json();
    expect(page.page_size).toBeLessThanOrEqual(100);
    expect(page.page_size).toBeGreaterThanOrEqual(1);
  });

  test('requires authentication', async ({ api }) => {
    const res = await api.get('/api/transactions');
    expect(res.status()).toBe(401);
  });

  test('another agent does not see this agent’s transactions', async ({ api }) => {
    const otherToken = await login(api, USERS.bug);
    const res = await api.get('/api/transactions', {
      headers: bearer(otherToken),
      params: { search: 'Feed Journey' }
    });
    expect((await res.json()).total).toBe(0);
  });
});
