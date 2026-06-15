// Dashboard activity feed. Other services log here on create/transition.

import type { Transaction, TransactionKind, TransactionPage } from '$lib/schemas';
import { db, newId } from '../store';

export function logTransaction(input: {
	agentId: string;
	kind: TransactionKind;
	referenceId: string;
	title: string;
	summary: string;
	status: string;
}): Transaction {
	const now = new Date().toISOString();
	const tx: Transaction = {
		id: newId('tx'),
		agent_id: input.agentId,
		kind: input.kind,
		reference_id: input.referenceId,
		title: input.title,
		summary: input.summary,
		status: input.status,
		created_at: now,
		updated_at: now
	};
	db().transactions.unshift(tx);
	return tx;
}

/** Update the latest transaction for a reference (e.g. quotation draft → illustrated). */
export function updateTransaction(
	referenceId: string,
	patch: Partial<Pick<Transaction, 'title' | 'summary' | 'status'>>
): void {
	const tx = db().transactions.find((t) => t.reference_id === referenceId);
	if (tx) {
		Object.assign(tx, patch, { updated_at: new Date().toISOString() });
	}
}

export interface TransactionFilter {
	kind?: TransactionKind;
	status?: string;
	search?: string;
	page?: number;
	pageSize?: number;
}

export function listTransactions(agentId: string, filter: TransactionFilter = {}): TransactionPage {
	const page = Math.max(1, filter.page ?? 1);
	const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
	const q = filter.search?.trim().toLowerCase();

	let items = db().transactions.filter((t) => t.agent_id === agentId);
	if (filter.kind) items = items.filter((t) => t.kind === filter.kind);
	if (filter.status) items = items.filter((t) => t.status === filter.status);
	if (q) {
		items = items.filter(
			(t) => t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q)
		);
	}

	const total = items.length;
	const start = (page - 1) * pageSize;
	return { items: items.slice(start, start + pageSize), total, page, page_size: pageSize };
}
