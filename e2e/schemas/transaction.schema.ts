import { z } from 'zod';
import { TransactionKind, pageOf } from './common.schema';

export const Transaction = z.object({
	id: z.string(),
	agent_id: z.string(),
	kind: TransactionKind,
	reference_id: z.string(),
	title: z.string(),
	summary: z.string(),
	status: z.string(),
	created_at: z.string(),
	updated_at: z.string()
});
export type Transaction = z.infer<typeof Transaction>;

/** GET /api/transactions response. */
export const TransactionPage = pageOf(Transaction);
export type TransactionPage = z.infer<typeof TransactionPage>;
