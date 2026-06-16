import { z } from 'zod';
import { Gender, Modal, QuotationStatus } from './common.schema';

export const RiderSelection = z.object({
	code: z.string(),
	sum_assured: z.number()
});
export type RiderSelection = z.infer<typeof RiderSelection>;

export const RiderPremium = z.object({
	code: z.string(),
	premium: z.number()
});

export const QuotationCalc = z.object({
	base_premium: z.number(),
	rider_premiums: z.array(RiderPremium),
	total_annual_premium: z.number(),
	modal_premium: z.number()
});
export type QuotationCalc = z.infer<typeof QuotationCalc>;

export const Quotation = z.object({
	id: z.string(),
	agent_id: z.string(),
	lead_id: z.string().nullable(),
	package_code: z.string().nullable(),
	insured_name: z.string(),
	insured_dob: z.string(),
	insured_age: z.number(),
	insured_gender: Gender,
	insured_occupation: z.string().nullable(),
	base_product_code: z.string().nullable(),
	sum_assured: z.number(),
	term: z.number(),
	modal: Modal,
	riders: z.array(RiderSelection),
	calc: QuotationCalc.nullable(),
	status: QuotationStatus,
	illustration_id: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string()
});
export type Quotation = z.infer<typeof Quotation>;

export const BenefitLine = z.object({
	label: z.string(),
	detail: z.string(),
	sum_assured: z.number().nullable(),
	premium: z.number().nullable()
});

/** A Sales Illustration (SI-YYYYMMDD-XXXX). */
export const Illustration = z.object({
	id: z.string(),
	number: z.string(),
	quotation_id: z.string(),
	agent_id: z.string(),
	insured_name: z.string(),
	insured_age: z.number(),
	product_name: z.string(),
	term: z.number(),
	modal: Modal,
	benefits: z.array(BenefitLine),
	calc: QuotationCalc,
	created_at: z.string()
});
export type Illustration = z.infer<typeof Illustration>;
