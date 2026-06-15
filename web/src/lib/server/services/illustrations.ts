// Sales Illustration: a finalized, presentable summary generated from a quotation.
// Scenario hook: agent.error fails here with a 500 (no SI is created).

import type { BenefitLine, SalesIllustration, User } from '$lib/schemas';
import { RIDER_TYPE_LABELS } from '$lib/schemas';
import { ApiError } from '../api-error';
import { db, newId } from '../store';
import { getProduct, getRider } from './catalog';
import { getQuotation } from './quotations';
import { updateTransaction, logTransaction } from './transactions';

function siNumber(id: string): string {
	const d = new Date();
	const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
	const suffix = id
		.replace(/[^a-z0-9]/gi, '')
		.slice(-4)
		.toUpperCase()
		.padStart(4, '0');
	return `SI-${ymd}-${suffix}`;
}

function buildBenefits(productName: string, q: ReturnType<typeof getQuotation>): BenefitLine[] {
	const calc = q.calc!;
	const lines: BenefitLine[] = [
		{
			label: 'Life Coverage',
			detail: `${productName} — ${q.term >= 99 ? 'whole of life' : `${q.term}-year term`}`,
			sum_assured: q.sum_assured,
			premium: calc.base_premium
		}
	];
	for (const sel of q.riders) {
		const plan = getRider(sel.code);
		const premium = calc.rider_premiums.find((r) => r.code === sel.code)?.premium ?? 0;
		lines.push({
			label: plan.name,
			detail: RIDER_TYPE_LABELS[plan.rider_type],
			sum_assured: plan.flat_premium != null ? null : sel.sum_assured,
			premium
		});
	}
	return lines;
}

export function createIllustration(user: User, quotationId: string): SalesIllustration {
	const q = getQuotation(user, quotationId);
	if (!q.base_product_code || !q.calc) {
		throw ApiError.conflict('Complete the plan and premium before creating an illustration');
	}

	// Scenario: the error agent's illustration generation always fails.
	if (user.scenario_flag === 'error') {
		throw ApiError.server('Failed to generate the sales illustration. Please try again.');
	}

	const product = getProduct(q.base_product_code);
	const id = newId('si');
	const si: SalesIllustration = {
		id,
		number: siNumber(id),
		quotation_id: q.id,
		agent_id: user.id,
		insured_name: q.insured_name,
		insured_age: q.insured_age,
		product_name: product.name,
		term: q.term,
		modal: q.modal,
		benefits: buildBenefits(product.name, q),
		calc: q.calc,
		created_at: new Date().toISOString()
	};
	db().illustrations.set(si.id, si);

	q.status = 'illustrated';
	q.illustration_id = si.id;
	q.updated_at = si.created_at;

	updateTransaction(q.id, { title: 'Illustrated Quotation', status: 'illustrated' });
	logTransaction({
		agentId: user.id,
		kind: 'illustration',
		referenceId: si.id,
		title: 'Sales Illustration',
		summary: `${si.number} — ${si.insured_name}`,
		status: 'created'
	});
	return si;
}

export function getIllustration(user: User, id: string): SalesIllustration {
	const si = db().illustrations.get(id);
	if (!si || si.agent_id !== user.id) throw ApiError.notFound('Illustration not found');
	return si;
}
