// Quotation workflow: step 1 captures the insured; step 2/2.1 chooses a plan or
// package, riders and coverage, recomputing the premium. Scenario hooks live here:
//   glitch → artificial delay on calculate; bug → +5% base premium inflation.

import type {
	CatalogRiderPlan,
	CreateQuotationRequest,
	QuotationCalc,
	Quotation,
	RiderSelection,
	UpdateQuotationRequest,
	User
} from '$lib/schemas';
import { ApiError } from '../api-error';
import { ageFromDob, validateCoverage } from '../domain/validation';
import { calculate } from '../domain/premium';
import { db, newId } from '../store';
import { findProduct, findRider, getProduct } from './catalog';
import { getLead } from './leads';
import { getPackage } from './packages';
import { logTransaction, updateTransaction } from './transactions';

export function listQuotations(user: User): Quotation[] {
	return [...db().quotations.values()]
		.filter((q) => q.agent_id === user.id)
		.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getQuotation(user: User, id: string): Quotation {
	const q = db().quotations.get(id);
	if (!q || q.agent_id !== user.id) throw ApiError.notFound('Quotation not found');
	return q;
}

export function createQuotation(user: User, input: CreateQuotationRequest): Quotation {
	let insured_name: string;
	let insured_dob: string;
	let insured_gender: Quotation['insured_gender'];
	let insured_occupation: string | null;
	let lead_id: string | null = null;

	if (input.lead_id) {
		const lead = getLead(user, input.lead_id);
		lead_id = lead.id;
		insured_name = lead.full_name;
		insured_dob = lead.dob;
		insured_gender = lead.gender;
		insured_occupation = lead.occupation;
	} else if (input.insured) {
		insured_name = input.insured.full_name;
		insured_dob = input.insured.dob;
		insured_gender = input.insured.gender;
		insured_occupation = input.insured.occupation ?? null;
	} else {
		throw ApiError.validation([{ field: 'insured', message: 'Insured details are required' }]);
	}

	const now = new Date().toISOString();
	const q: Quotation = {
		id: newId('quo'),
		agent_id: user.id,
		lead_id,
		package_code: null,
		insured_name,
		insured_dob,
		insured_age: ageFromDob(insured_dob),
		insured_gender,
		insured_occupation,
		base_product_code: null,
		sum_assured: 0,
		term: 0,
		modal: 'annual',
		riders: [],
		calc: null,
		status: 'draft',
		illustration_id: null,
		created_at: now,
		updated_at: now
	};
	db().quotations.set(q.id, q);
	logTransaction({
		agentId: user.id,
		kind: 'quotation',
		referenceId: q.id,
		title: 'Draft Quotation',
		summary: insured_name,
		status: 'draft'
	});
	return q;
}

/** Resolve rider plans for the current selections, erroring on unknown codes. */
function resolveRiders(
	riders: RiderSelection[]
): { plan: CatalogRiderPlan; selection: RiderSelection }[] {
	return riders.map((selection) => {
		const plan = findRider(selection.code);
		if (!plan)
			throw ApiError.validation([{ field: `rider.${selection.code}`, message: 'Unknown rider' }]);
		return { plan, selection };
	});
}

/** Compute the premium breakdown for a quotation in its current state. */
function computeCalc(q: Quotation, user: User): QuotationCalc | null {
	if (!q.base_product_code || q.sum_assured <= 0 || q.term <= 0) return null;
	const product = getProduct(q.base_product_code);
	const riders = resolveRiders(q.riders);
	const errors = validateCoverage(product, q.insured_age, q.sum_assured, q.term, riders);
	if (errors.length) throw ApiError.validation(errors);
	return calculate(
		product,
		riders,
		q.insured_age,
		q.sum_assured,
		q.term,
		q.modal,
		user.scenario_flag === 'bug'
	);
}

export function updateQuotation(user: User, id: string, input: UpdateQuotationRequest): Quotation {
	const q = getQuotation(user, id);
	if (q.status !== 'draft') throw ApiError.conflict('Quotation is already finalized');

	// Applying a package seeds product, coverage, term, modal and riders.
	if (input.apply_package) {
		const pkg = getPackage(user, input.apply_package);
		q.package_code = pkg.base_product_code ? pkg.id : q.package_code;
		q.base_product_code = pkg.base_product_code;
		q.sum_assured = pkg.default_sum_assured;
		q.term = pkg.term;
		q.modal = pkg.modal;
		q.riders = pkg.riders.map((r) => ({ ...r }));
	}

	if (input.base_product_code !== undefined) {
		const product = findProduct(input.base_product_code);
		if (!product) {
			throw ApiError.validation([{ field: 'base_product_code', message: 'Unknown base product' }]);
		}
		const changed = q.base_product_code !== product.code;
		q.base_product_code = product.code;
		q.package_code = null;
		// Seed sensible defaults when switching to a product fresh.
		if (changed && q.sum_assured <= 0) q.sum_assured = product.min_sum_assured;
		if (changed && !product.term_options.includes(q.term)) q.term = product.term_options[0];
	}

	if (input.sum_assured !== undefined) q.sum_assured = input.sum_assured;
	if (input.term !== undefined) q.term = input.term;
	if (input.modal !== undefined) q.modal = input.modal;
	if (input.riders !== undefined) q.riders = input.riders.map((r) => ({ ...r }));

	q.calc = computeCalc(q, user);
	q.updated_at = new Date().toISOString();
	updateTransaction(q.id, { summary: q.insured_name });
	return q;
}

const GLITCH_DELAY_MS = 3500;

/** Preview calculation (no persist). Applies the glitch delay and bug inflation. */
export async function calculateQuotation(user: User, id: string): Promise<QuotationCalc> {
	const q = getQuotation(user, id);
	if (user.scenario_flag === 'glitch') {
		await new Promise((r) => setTimeout(r, GLITCH_DELAY_MS));
	}
	const calc = computeCalc(q, user);
	if (!calc) {
		throw ApiError.validation([
			{ field: 'base_product_code', message: 'Select a plan and coverage before calculating' }
		]);
	}
	return calc;
}
