/** Seeded test users, catalog codes, and lead/insured helpers used across the suite. */

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
