// Premium calculation. Faithful port of backend/src/quotations/calc.rs so that
// numbers are byte-for-byte reproducible for QA training scenarios.

import { MODAL_FACTORS } from '$lib/schemas';
import type {
	CatalogProduct,
	CatalogRiderPlan,
	Modal,
	QuotationCalc,
	RiderPremium,
	RiderSelection
} from '$lib/schemas';

/** Interpolate a rate from an age-keyed rate table. */
export function rateForAge(table: [number, number][], age: number): number {
	if (table.length === 0) return 0;
	// Below the first band → first rate; above the last → last rate.
	if (age <= table[0][0]) return table[0][1];
	for (let i = 0; i < table.length - 1; i++) {
		const [a0, r0] = table[i];
		const [a1, r1] = table[i + 1];
		if (age >= a0 && age <= a1) {
			if (a1 === a0) return r0;
			const t = (age - a0) / (a1 - a0);
			return r0 + t * (r1 - r0);
		}
	}
	return table[table.length - 1][1];
}

/** Term factor: longer terms cost slightly more; whole life (99) and endowment have their own curves. */
export function termFactor(term: number, productCode: string): number {
	if (term >= 99) return 0.95;
	const factor = 1.0 + (term - 10) * 0.0075;
	return productCode === 'LIFE_ENDOW' ? factor * 0.8 : factor;
}

/** How much of the annual premium each installment represents. */
export function modalFactor(modal: Modal): number {
	return MODAL_FACTORS[modal];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Full premium breakdown for a quotation.
 * If `bugInflate` is true, the base premium is inflated ~5% (agent.bug scenario).
 */
export function calculate(
	product: CatalogProduct,
	riders: { plan: CatalogRiderPlan; selection: RiderSelection }[],
	age: number,
	sumAssured: number,
	term: number,
	modal: Modal,
	bugInflate: boolean
): QuotationCalc {
	const baseRate = rateForAge(product.rate_per_thousand, age);
	let basePremium = (sumAssured / 1000) * baseRate * termFactor(term, product.code);
	if (bugInflate) basePremium *= 1.05;

	const riderPremiums: RiderPremium[] = riders.map(({ plan, selection }) => {
		let prem = 0;
		if (plan.flat_premium != null) {
			prem = plan.flat_premium;
		} else if (plan.rate_per_thousand != null) {
			prem = (selection.sum_assured / 1000) * rateForAge(plan.rate_per_thousand, age);
		}
		return { code: plan.code, premium: round2(prem) };
	});

	const ridersTotal = riderPremiums.reduce((acc, r) => acc + r.premium, 0);
	const totalAnnual = basePremium + ridersTotal;
	const modalPremium = totalAnnual * modalFactor(modal);

	return {
		base_premium: round2(basePremium),
		rider_premiums: riderPremiums,
		total_annual_premium: round2(totalAnnual),
		modal_premium: round2(modalPremium)
	};
}
