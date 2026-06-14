import { test, expect } from '../fixtures/api';

test.describe('API · health', () => {
  test('GET /api/health returns ok', async ({ api }) => {
    const res = await api.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});
