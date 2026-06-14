import { test, expect, login, bearer, backendContext, resetState } from '../fixtures/api';
import { USERS, randomThaiNationalId } from '../fixtures/data';

// Spec: docs/requirements/08-admin-qa-tooling.md
//
// NOTE: In the current backend, admin endpoints authorize ONLY an
// `agent.standard` session — the ADMIN_SECRET header path exists in the guard
// helper but is not wired into the handlers. These tests assert today's
// behavior.
test.describe('API · admin & QA tooling', () => {
  let token: string;
  test.beforeAll(async () => {
    const ctx = await backendContext();
    token = await resetState(ctx);
    await ctx.dispose();
  });

  test('debug-state reports seed baseline after reset', async ({ api }) => {
    const res = await api.get('/api/admin/debug-state', { headers: bearer(token) });
    expect(res.status()).toBe(200);
    const s = await res.json();
    expect(s.users).toBe(5);
    expect(s.catalog_products).toBe(4);
    expect(s.catalog_riders).toBeGreaterThanOrEqual(20);
    expect(s.current_user).toBe(USERS.standard);
    expect(s.scenario).toBe('standard');
  });

  test('non-standard agents are forbidden (403)', async ({ api }) => {
    const bugToken = await login(api, USERS.bug);
    const res = await api.get('/api/admin/debug-state', { headers: bearer(bugToken) });
    expect(res.status()).toBe(403);
  });

  test('user listing never exposes passwords', async ({ api }) => {
    const list = await api.get('/api/admin/users', { headers: bearer(token) });
    expect(list.status()).toBe(200);
    const users = await list.json();
    expect(users).toHaveLength(5);
    expect(users.every((u: { password?: string }) => (u.password ?? '') === '')).toBeTruthy();

    const one = await api.get(`/api/admin/users/${USERS.glitch}`, { headers: bearer(token) });
    expect(one.status()).toBe(200);
    expect((await one.json()).scenario_flag).toBe('glitch');

    const missing = await api.get('/api/admin/users/ghost', { headers: bearer(token) });
    expect(missing.status()).toBe(404);
  });

  test('seed-extra creates a lead + transaction, with the same validation', async ({ api }) => {
    const before = await (
      await api.get('/api/admin/debug-state', { headers: bearer(token) })
    ).json();

    const bad = await api.post('/api/admin/seed-extra', {
      headers: bearer(token),
      data: { full_name: 'Bad ID', national_id: '0000000000000', phone: '0812345678' }
    });
    expect(bad.status()).toBe(422);

    const ok = await api.post('/api/admin/seed-extra', {
      headers: bearer(token),
      data: { full_name: 'Seeded Lead', national_id: randomThaiNationalId(), phone: '0898765432' }
    });
    expect(ok.status()).toBe(201);

    const after = await (
      await api.get('/api/admin/debug-state', { headers: bearer(token) })
    ).json();
    expect(after.leads).toBe(before.leads + 1);
    expect(after.transactions).toBe(before.transactions + 1);
  });

  test('reset invalidates existing sessions', async ({ api }) => {
    const freshToken = await login(api, USERS.standard);
    const reset = await api.post('/api/admin/reset', { headers: bearer(freshToken) });
    expect(reset.status()).toBe(204);
    const me = await api.get('/api/auth/me', { headers: bearer(freshToken) });
    expect(me.status()).toBe(401);
  });
});
