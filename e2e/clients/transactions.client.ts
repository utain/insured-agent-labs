import { BaseResource } from './base.client';
import { TransactionPage, type TransactionKind } from '../schemas';

/** `/api/transactions` — the agent's activity feed. */
export class TransactionsApi extends BaseResource {
	/** GET /api/transactions, optionally filtered by kind. */
	list(filter: { kind?: TransactionKind } = {}, opts: { expect?: number } = {}) {
		return this.http.get('/api/transactions', {
			schema: TransactionPage,
			params: filter.kind ? { kind: filter.kind } : undefined,
			expect: opts.expect
		});
	}
}
