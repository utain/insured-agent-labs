// Domain validation helpers shared by services.

import type { CatalogProduct, CatalogRiderPlan, RiderSelection } from '$lib/schemas';

export interface FieldError {
	field: string;
	message: string;
}

/** Age in whole years from an ISO date (YYYY-MM-DD) at a reference date (default today). */
export function ageFromDob(dob: string, at: Date = new Date()): number {
	const [y, m, d] = dob.split('-').map(Number);
	let age = at.getUTCFullYear() - y;
	const beforeBirthday =
		at.getUTCMonth() + 1 < m || (at.getUTCMonth() + 1 === m && at.getUTCDate() < d);
	if (beforeBirthday) age -= 1;
	return age;
}

/** Thai national-id checksum (13 digits). Optional in this MVP; used only when a value is supplied. */
export function isValidThaiNationalId(id: string): boolean {
	if (!/^\d{13}$/.test(id)) return false;
	const digits = id.split('').map(Number);
	let sum = 0;
	for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i);
	const check = (11 - (sum % 11)) % 10;
	return digits[12] === check;
}

/**
 * Validate the quotation coverage inputs against the chosen product and riders.
 * Returns a list of field errors (empty = valid).
 */
export function validateCoverage(
	product: CatalogProduct,
	age: number,
	sumAssured: number,
	term: number,
	riders: { plan: CatalogRiderPlan; selection: RiderSelection }[]
): FieldError[] {
	const errors: FieldError[] = [];

	if (age < product.min_age || age > product.max_age) {
		errors.push({
			field: 'insured_age',
			message: `Age ${age} is outside the allowed range ${product.min_age}–${product.max_age} for ${product.name}`
		});
	}
	if (sumAssured < product.min_sum_assured || sumAssured > product.max_sum_assured) {
		errors.push({
			field: 'sum_assured',
			message: `Sum assured must be between ${product.min_sum_assured.toLocaleString()} and ${product.max_sum_assured.toLocaleString()}`
		});
	}
	if (!product.term_options.includes(term)) {
		errors.push({
			field: 'term',
			message: `Term ${term} is not available for ${product.name}`
		});
	}
	for (const { plan, selection } of riders) {
		if (age < plan.min_age || age > plan.max_age) {
			errors.push({
				field: `rider.${plan.code}`,
				message: `Age ${age} is outside the allowed range for rider ${plan.name}`
			});
		}
		if (
			plan.flat_premium == null &&
			plan.sum_assured_options.length > 0 &&
			!plan.sum_assured_options.includes(selection.sum_assured)
		) {
			errors.push({
				field: `rider.${plan.code}`,
				message: `Invalid coverage amount for rider ${plan.name}`
			});
		}
	}
	return errors;
}
