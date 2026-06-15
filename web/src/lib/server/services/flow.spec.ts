// End-to-end service flow over the in-memory store, plus scenario assertions.

import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb } from '../store';
import { login } from './auth';
import { createLead, listLeads } from './leads';
import { createPackage, listPackages } from './packages';
import { createQuotation, updateQuotation, calculateQuotation } from './quotations';
import { createIllustration } from './illustrations';
import { ApiError } from '../api-error';
import type { User } from '$lib/schemas';

function as(username: string): User {
	return login({ username, password: 'insure_demo' }).user;
}

beforeEach(() => resetDb());

describe('auth scenarios', () => {
	it('locks agent.locked at login', () => {
		expect(() => login({ username: 'agent.locked', password: 'insure_demo' })).toThrow(ApiError);
		try {
			login({ username: 'agent.locked', password: 'insure_demo' });
		} catch (e) {
			expect((e as ApiError).status).toBe(423);
		}
	});

	it('rejects bad passwords', () => {
		expect(() => login({ username: 'agent.standard', password: 'nope' })).toThrow(ApiError);
	});
});

describe('happy-path quotation → illustration', () => {
	it('builds a quotation and produces a sales illustration', () => {
		const user = as('agent.standard');
		const lead = createLead(user, { full_name: 'Test Person', dob: '1990-01-01', gender: 'male' });

		const q = createQuotation(user, { lead_id: lead.id });
		expect(q.insured_age).toBeGreaterThan(30);

		const updated = updateQuotation(user, q.id, {
			base_product_code: 'LIFE_TERM',
			sum_assured: 1_000_000,
			term: 20,
			modal: 'annual',
			riders: [{ code: 'HEALTH_PLAN_2', sum_assured: 500_000 }]
		});
		expect(updated.calc).not.toBeNull();
		expect(updated.calc!.total_annual_premium).toBeGreaterThan(0);

		const si = createIllustration(user, q.id);
		expect(si.number).toMatch(/^SI-\d{8}-/);
		expect(si.benefits.length).toBe(2); // base + 1 rider
	});

	it('seeds a quotation from a package', () => {
		const user = as('agent.standard');
		const pkg = createPackage(user, {
			name: 'My Plan',
			description: '',
			base_product_code: 'LIFE_TERM',
			default_sum_assured: 2_000_000,
			term: 20,
			modal: 'annual',
			riders: [{ code: 'CI_PLAN_1', sum_assured: 200_000 }]
		});
		expect(listPackages(user).some((p) => p.id === pkg.id)).toBe(true);

		const q = createQuotation(user, {
			insured: { full_name: 'Fresh Start', dob: '1985-06-15', gender: 'female' }
		});
		const seeded = updateQuotation(user, q.id, { apply_package: pkg.id });
		expect(seeded.base_product_code).toBe('LIFE_TERM');
		expect(seeded.sum_assured).toBe(2_000_000);
		expect(seeded.riders).toHaveLength(1);
		expect(seeded.calc).not.toBeNull();
	});
});

describe('per-user bug scenarios', () => {
	function premiumFor(username: string): number {
		const user = as(username);
		const q = createQuotation(user, {
			insured: { full_name: 'X', dob: '1990-01-01', gender: 'male' }
		});
		const u = updateQuotation(user, q.id, {
			base_product_code: 'LIFE_TERM',
			sum_assured: 1_000_000,
			term: 20
		});
		return u.calc!.base_premium;
	}

	it('agent.bug inflates the base premium ~5%', () => {
		expect(premiumFor('agent.bug') / premiumFor('agent.standard')).toBeCloseTo(1.05, 2);
	});

	it('agent.error fails to create an illustration', async () => {
		const user = as('agent.error');
		const q = createQuotation(user, {
			insured: { full_name: 'X', dob: '1990-01-01', gender: 'male' }
		});
		updateQuotation(user, q.id, {
			base_product_code: 'LIFE_TERM',
			sum_assured: 1_000_000,
			term: 20
		});
		expect(() => createIllustration(user, q.id)).toThrow(ApiError);
	});

	it('agent.glitch delays calculate by ~3.5s', async () => {
		const user = as('agent.glitch');
		const q = createQuotation(user, {
			insured: { full_name: 'X', dob: '1990-01-01', gender: 'male' }
		});
		updateQuotation(user, q.id, {
			base_product_code: 'LIFE_TERM',
			sum_assured: 1_000_000,
			term: 20
		});
		const start = Date.now();
		await calculateQuotation(user, q.id);
		expect(Date.now() - start).toBeGreaterThan(3000);
	}, 10_000);

	it('agents only see their own leads', () => {
		const a = as('agent.standard');
		const b = as('agent.bug');
		createLead(b, { full_name: 'B Lead', dob: '1990-01-01', gender: 'other' });
		expect(listLeads(a).every((l) => l.agent_id === a.id)).toBe(true);
	});
});
