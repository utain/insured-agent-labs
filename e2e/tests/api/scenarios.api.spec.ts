import { test, expect, expectError } from '../../fixtures/api';
import { USERS, PRODUCTS, validInsured } from '../../fixtures/data';
import type { AgentApi } from '../../clients';

// The deterministic per-agent behaviours. See docs/TEST-USERS.md.

/** Draft a quotation with fixed params (same insured age across agents). */
async function draftQuote(agent: AgentApi): Promise<string> {
	const q = await agent.quotations.create({ insured: validInsured({ dob: '1985-06-15' }) });
	await agent.quotations.setCoverage(q.id, {
		product: PRODUCTS.term,
		sumAssured: 1_000_000,
		term: 20,
		modal: 'annual'
	});
	return q.id;
}

test.describe('API · scenarios', () => {
	test('locked: login is rejected with 423', async ({ anon }) => {
		await anon.auth.login(USERS.locked, undefined, { expect: 423 });
	});

	test('bug: base premium is inflated ~5% vs. standard for identical inputs', async ({
		agent,
		loginAs
	}) => {
		const bug = await loginAs(USERS.bug);
		const stdId = await draftQuote(agent);
		const bugId = await draftQuote(bug);

		const stdCalc = await agent.quotations.calculate(stdId);
		const bugCalc = await bug.quotations.calculate(bugId);
		expect(stdCalc.base_premium).toBeGreaterThan(0);
		expect(bugCalc.base_premium / stdCalc.base_premium).toBeCloseTo(1.05, 2);
	});

	test('glitch: calculate is delayed ~3s', async ({ loginAs }) => {
		const glitch = await loginAs(USERS.glitch);
		const id = await draftQuote(glitch);

		const start = Date.now();
		await glitch.quotations.calculate(id);
		const elapsed = Date.now() - start;

		expect(elapsed).toBeGreaterThanOrEqual(2_900);
		expect(elapsed).toBeLessThan(10_000);
	});

	test('error: illustrate returns 500 and leaves the quotation in draft', async ({ loginAs }) => {
		const errorAgent = await loginAs(USERS.error);
		const id = await draftQuote(errorAgent);

		const body = await expectError(errorAgent.quotations.illustrate(id, { expect: 500 }));
		expect(body.error.code).toBe('server_error');

		const q = await errorAgent.quotations.get(id);
		expect(q.status).toBe('draft');
	});
});
