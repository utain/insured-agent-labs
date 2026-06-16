// Shared domain enums, the error envelope, and a pagination helper.
// These mirror web/src/lib/schemas.ts — the app's single source of truth — so the
// suite validates real response contracts at runtime, not hand-maintained guesses.

import { z } from 'zod';

// ===== Enums =====

export const Gender = z.enum(['male', 'female', 'other']);
export type Gender = z.infer<typeof Gender>;

export const Modal = z.enum(['annual', 'semi', 'quarterly', 'monthly']);
export type Modal = z.infer<typeof Modal>;

export const RiderType = z.enum(['health', 'ci', 'pa', 'tpd', 'wp']);
export type RiderType = z.infer<typeof RiderType>;

export const LeadStatus = z.enum(['new', 'contacted', 'quoted', 'customer']);
export type LeadStatus = z.infer<typeof LeadStatus>;

export const QuotationStatus = z.enum(['draft', 'illustrated']);
export type QuotationStatus = z.infer<typeof QuotationStatus>;

export const TransactionKind = z.enum(['lead', 'quotation', 'illustration']);
export type TransactionKind = z.infer<typeof TransactionKind>;

// ===== Error envelope (web/src/lib/server/api-error.ts) =====

/** A single field-level validation error. */
export const FieldError = z.object({
	field: z.string(),
	message: z.string()
});

/** The uniform `{ error: {...} }` envelope returned for every 4xx/5xx. */
export const ErrorBody = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		fields: z.array(FieldError).optional()
	})
});
export type ErrorBody = z.infer<typeof ErrorBody>;

// ===== Pagination =====

/** Wrap an item schema in the `{ items, total, page, page_size }` page envelope. */
export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
	z.object({
		items: z.array(item),
		total: z.number(),
		page: z.number(),
		page_size: z.number()
	});
