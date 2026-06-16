import { z } from 'zod';
import { RiderType } from './common.schema';

/** [age, premium-per-1000-SA] band. */
const RateBand = z.tuple([z.number(), z.number()]);

export const CatalogProduct = z.object({
	code: z.string(),
	name: z.string(),
	description: z.string(),
	min_age: z.number(),
	max_age: z.number(),
	min_sum_assured: z.number(),
	max_sum_assured: z.number(),
	term_options: z.array(z.number()),
	rate_per_thousand: z.array(RateBand)
});
export type CatalogProduct = z.infer<typeof CatalogProduct>;

export const CatalogRiderPlan = z.object({
	code: z.string(),
	rider_type: RiderType,
	name: z.string(),
	description: z.string(),
	min_age: z.number(),
	max_age: z.number(),
	sum_assured_options: z.array(z.number()),
	flat_premium: z.number().nullable(),
	rate_per_thousand: z.array(RateBand).nullable()
});
export type CatalogRiderPlan = z.infer<typeof CatalogRiderPlan>;
