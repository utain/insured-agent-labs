// Ported from backend/src/quotations/calc.rs tests — premium parity anchor.

import { describe, it, expect } from 'vitest';
import { calculate, modalFactor } from './premium';
import type { CatalogProduct } from '$lib/schemas';

function sampleProduct(): CatalogProduct {
	return {
		code: 'LIFE_TERM',
		name: 'Term',
		description: '',
		min_age: 18,
		max_age: 70,
		min_sum_assured: 100_000,
		max_sum_assured: 10_000_000,
		term_options: [10, 20, 30],
		rate_per_thousand: [
			[18, 2.0],
			[30, 3.5],
			[40, 6.0],
			[50, 10.0],
			[60, 18.0]
		]
	};
}

describe('premium calculation', () => {
	it('computes the base premium with age interpolation and term factor', () => {
		const p = sampleProduct();
		const calc = calculate(p, [], 35, 1_000_000, 20, 'annual', false);
		// age 35: rate = 3.5 + 0.5*(6.0-3.5) = 4.75; term 20: factor = 1.075
		// base = 1000 * 4.75 * 1.075 = 5106.25
		expect(Math.abs(calc.base_premium - 5106.25)).toBeLessThan(0.1);
		expect(calc.rider_premiums.length).toBe(0);
		expect(Math.abs(calc.total_annual_premium - 5106.25)).toBeLessThan(0.1);
	});

	it('applies modal factors', () => {
		const p = sampleProduct();
		const annual = calculate(p, [], 35, 1_000_000, 20, 'annual', false);
		const monthly = calculate(p, [], 35, 1_000_000, 20, 'monthly', false);
		const ratio = monthly.modal_premium / annual.total_annual_premium;
		expect(Math.abs(ratio - 0.09)).toBeLessThan(0.001);
	});

	it('inflates the base premium ~5% for the bug scenario', () => {
		const p = sampleProduct();
		const normal = calculate(p, [], 35, 1_000_000, 20, 'annual', false);
		const buggy = calculate(p, [], 35, 1_000_000, 20, 'annual', true);
		expect(buggy.base_premium).toBeGreaterThan(normal.base_premium);
		expect(Math.abs(buggy.base_premium / normal.base_premium - 1.05)).toBeLessThan(0.01);
	});

	it('modal factor table matches the spec', () => {
		expect(modalFactor('annual')).toBe(1.0);
		expect(modalFactor('semi')).toBe(0.52);
		expect(modalFactor('quarterly')).toBe(0.27);
		expect(modalFactor('monthly')).toBe(0.09);
	});
});
