// Single source of truth for domain types and request validation.
// Entity interfaces describe what the in-memory store holds and what the API returns.
// Zod schemas validate incoming request bodies (API routes + page form actions).

import { z } from 'zod';

// ===== Enums =====

export type Role = 'agent' | 'admin';
export type ScenarioFlag = 'standard' | 'locked' | 'glitch' | 'bug' | 'error';
export type Gender = 'male' | 'female' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'customer';
export type QuotationStatus = 'draft' | 'illustrated';
export type Modal = 'annual' | 'semi' | 'quarterly' | 'monthly';
export type RiderType = 'health' | 'ci' | 'pa' | 'tpd' | 'wp';
export type TransactionKind = 'lead' | 'quotation' | 'illustration';

export const GENDERS: Gender[] = ['male', 'female', 'other'];
export const MODALS: Modal[] = ['annual', 'semi', 'quarterly', 'monthly'];
export const RIDER_TYPES: RiderType[] = ['health', 'ci', 'pa', 'tpd', 'wp'];

export const RIDER_TYPE_LABELS: Record<RiderType, string> = {
	health: 'Health',
	ci: 'Critical Illness',
	pa: 'Personal Accident',
	tpd: 'Total Permanent Disability',
	wp: 'Waiver of Premium'
};

export const MODAL_LABELS: Record<Modal, string> = {
	annual: 'Annual',
	semi: 'Semi-annual',
	quarterly: 'Quarterly',
	monthly: 'Monthly'
};

/** Installment factor: the fraction of the annual premium due at each payment.
 *  Includes the modal surcharge, so paying more often costs more over a year
 *  (e.g. monthly = 0.09 × 12 = 1.08 of the annual premium). */
export const MODAL_FACTORS: Record<Modal, number> = {
	annual: 1.0,
	semi: 0.52,
	quarterly: 0.27,
	monthly: 0.09
};

// ===== Entities =====

export interface User {
	id: string;
	username: string;
	display_name: string;
	role: Role;
	scenario_flag: ScenarioFlag;
}

export interface CatalogProduct {
	code: string;
	name: string;
	description: string;
	min_age: number;
	max_age: number;
	min_sum_assured: number;
	max_sum_assured: number;
	term_options: number[];
	/** [age, premium-per-1000-SA] bands, linearly interpolated. */
	rate_per_thousand: [number, number][];
}

export interface CatalogRiderPlan {
	code: string;
	rider_type: RiderType;
	name: string;
	description: string;
	min_age: number;
	max_age: number;
	sum_assured_options: number[];
	flat_premium: number | null;
	rate_per_thousand: [number, number][] | null;
}

export interface Lead {
	id: string;
	agent_id: string;
	full_name: string;
	dob: string; // ISO date (YYYY-MM-DD)
	gender: Gender;
	occupation: string | null;
	national_id: string | null;
	phone: string | null;
	email: string | null;
	status: LeadStatus;
	created_at: string;
	updated_at: string;
}

export interface RiderSelection {
	code: string;
	sum_assured: number;
}

export interface Package {
	id: string;
	agent_id: string | null; // null = global template
	name: string;
	description: string;
	base_product_code: string;
	default_sum_assured: number;
	term: number;
	modal: Modal;
	riders: RiderSelection[];
	created_at: string;
	updated_at: string;
}

export interface RiderPremium {
	code: string;
	premium: number;
}

export interface QuotationCalc {
	base_premium: number;
	rider_premiums: RiderPremium[];
	total_annual_premium: number;
	modal_premium: number;
}

export interface Quotation {
	id: string;
	agent_id: string;
	lead_id: string | null;
	package_code: string | null;
	insured_name: string;
	insured_dob: string;
	insured_age: number;
	insured_gender: Gender;
	insured_occupation: string | null;
	base_product_code: string | null;
	sum_assured: number;
	term: number;
	modal: Modal;
	riders: RiderSelection[];
	calc: QuotationCalc | null;
	status: QuotationStatus;
	illustration_id: string | null;
	created_at: string;
	updated_at: string;
}

export interface BenefitLine {
	label: string;
	detail: string;
	sum_assured: number | null;
	premium: number | null;
}

export interface SalesIllustration {
	id: string;
	number: string; // SI-YYYYMMDD-XXXX
	quotation_id: string;
	agent_id: string;
	insured_name: string;
	insured_age: number;
	product_name: string;
	term: number;
	modal: Modal;
	benefits: BenefitLine[];
	calc: QuotationCalc;
	created_at: string;
}

export interface Transaction {
	id: string;
	agent_id: string;
	kind: TransactionKind;
	reference_id: string;
	title: string;
	summary: string;
	status: string;
	created_at: string;
	updated_at: string;
}

export interface TransactionPage {
	items: Transaction[];
	total: number;
	page: number;
	page_size: number;
}

// ===== Request schemas (zod) =====

const genderSchema = z.enum(['male', 'female', 'other']);
const modalSchema = z.enum(['annual', 'semi', 'quarterly', 'monthly']);

export const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required')
});
export type LoginRequest = z.infer<typeof loginSchema>;

const dobSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD');

export const createLeadSchema = z.object({
	full_name: z.string().min(1, 'Full name is required'),
	dob: dobSchema,
	gender: genderSchema,
	occupation: z.string().trim().min(1).nullish(),
	national_id: z.string().trim().min(1).nullish(),
	phone: z.string().trim().min(1).nullish(),
	email: z.string().trim().email('Invalid email').nullish()
});
export type CreateLeadRequest = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial().extend({
	status: z.enum(['new', 'contacted', 'quoted', 'customer']).optional()
});
export type UpdateLeadRequest = z.infer<typeof updateLeadSchema>;

const riderSelectionSchema = z.object({
	code: z.string().min(1),
	sum_assured: z.number().int().nonnegative()
});

export const createPackageSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().default(''),
	base_product_code: z.string().min(1, 'Base product is required'),
	default_sum_assured: z.number().int().positive(),
	term: z.number().int().positive(),
	modal: modalSchema.default('annual'),
	riders: z.array(riderSelectionSchema).default([])
});
export type CreatePackageRequest = z.infer<typeof createPackageSchema>;

export const updatePackageSchema = createPackageSchema.partial();
export type UpdatePackageRequest = z.infer<typeof updatePackageSchema>;

export const createQuotationSchema = z
	.object({
		lead_id: z.string().min(1).optional(),
		insured: z
			.object({
				full_name: z.string().min(1, 'Full name is required'),
				dob: dobSchema,
				gender: genderSchema,
				occupation: z.string().trim().min(1).nullish()
			})
			.optional()
	})
	.refine((v) => v.lead_id || v.insured, {
		message: 'Provide either an existing lead_id or fresh insured details'
	});
export type CreateQuotationRequest = z.infer<typeof createQuotationSchema>;

export const updateQuotationSchema = z.object({
	base_product_code: z.string().min(1).optional(),
	apply_package: z.string().min(1).optional(),
	sum_assured: z.number().int().positive().optional(),
	term: z.number().int().positive().optional(),
	modal: modalSchema.optional(),
	riders: z.array(riderSelectionSchema).optional()
});
export type UpdateQuotationRequest = z.infer<typeof updateQuotationSchema>;
