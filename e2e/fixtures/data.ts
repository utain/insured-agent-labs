/** Seeded test users, catalog codes, seed counts, and lead/insured builders. */

export const USERS = {
	standard: 'agent.standard',
	locked: 'agent.locked',
	glitch: 'agent.glitch',
	bug: 'agent.bug',
	error: 'agent.error'
} as const;

export const PRODUCTS = {
	term: 'LIFE_TERM',
	whole: 'LIFE_WHOLE',
	endow: 'LIFE_ENDOW',
	ulip: 'LIFE_ULIP'
} as const;

/** Rider plan codes (seeded as `${TYPE}_PLAN_${i}`). The handful referenced by specs. */
export const RIDERS = {
	health2: 'HEALTH_PLAN_2',
	health4: 'HEALTH_PLAN_4',
	ci1: 'CI_PLAN_1',
	ci2: 'CI_PLAN_2',
	pa2: 'PA_PLAN_2',
	wp2: 'WP_PLAN_2'
} as const;

/** Seeded rider catalog cardinality (see web/src/lib/server/seed.ts). */
export const RIDER_COUNTS = { total: 27, health: 5, ci: 6, pa: 6, tpd: 5, wp: 5 } as const;

/** Entity counts the deterministic seed restores — asserted by the admin spec. */
export const SEED = {
	users: 5,
	products: 4,
	riders: RIDER_COUNTS.total,
	packages: 3,
	quotations: 0,
	illustrations: 0
} as const;

export interface LeadInput {
	full_name: string;
	dob: string;
	gender: 'male' | 'female' | 'other';
	occupation?: string;
	national_id?: string;
	phone?: string;
	email?: string;
}

/** A valid lead payload, overridable per field. national_id/phone are optional. */
export function validLead(overrides: Partial<LeadInput> = {}): LeadInput {
	return {
		full_name: 'Somchai Jaidee',
		dob: '1990-01-01',
		gender: 'male',
		occupation: 'Engineer',
		...overrides
	};
}

/** Fresh-start insured details (no lead record). */
export function validInsured(overrides: Partial<LeadInput> = {}) {
	return {
		full_name: 'Fresh Start',
		dob: '1985-06-15',
		gender: 'female' as const,
		occupation: 'Teacher',
		...overrides
	};
}
