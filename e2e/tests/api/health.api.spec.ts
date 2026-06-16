import { test, expect } from '../../fixtures/api';

test.describe('API · health', () => {
	test('GET /api/healthz returns ok', { tag: ['@smoke'] }, async ({ anon }) => {
		const health = await anon.admin.health();
		expect(health.status).toBe('ok');
	});
});
