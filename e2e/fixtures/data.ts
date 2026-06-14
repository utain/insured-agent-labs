/** Seeded test users, catalog codes, and Thai-ID helpers used across the suite. */

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

/** Known-valid Thai national IDs (pass the backend checksum). */
export const VALID_NATIONAL_IDS = ['1100200123453', '1234567890120'] as const;

/**
 * Compute the check digit using the SAME algorithm the backend enforces
 * (`validate_thai_national_id` in backend/src/db.rs): for the first 12 digits,
 * weight[i] = (i % 12) + 1, then check = (11 - (sum % 11)) % 10.
 * IDs produced here are valid by construction.
 */
export function thaiNationalId(prefix12: string): string {
  if (!/^\d{12}$/.test(prefix12)) throw new Error('prefix must be 12 digits');
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(prefix12[i]) * ((i % 12) + 1);
  const check = (11 - (sum % 11)) % 10;
  return prefix12 + String(check);
}

/** A fresh, checksum-valid Thai national ID (handy for unique-per-test data). */
export function randomThaiNationalId(): string {
  let prefix = '';
  for (let i = 0; i < 12; i++) prefix += Math.floor(Math.random() * 10);
  return thaiNationalId(prefix);
}

export interface LeadInput {
  full_name: string;
  national_id: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  occupation?: string;
  income?: number;
}

/** A valid lead payload, overridable per field. */
export function validLead(overrides: Partial<LeadInput> = {}): LeadInput {
  return {
    full_name: 'Somchai Jaidee',
    national_id: randomThaiNationalId(),
    dob: '1990-01-01',
    gender: 'male',
    phone: '0812345678',
    email: 'somchai@example.com',
    occupation: 'Engineer',
    income: 600000,
    ...overrides
  };
}

/** Beneficiaries that sum to 100% with checksum-valid IDs. */
export function validBeneficiaries() {
  return [
    {
      name: 'Malee Jaidee',
      relationship: 'Spouse',
      national_id: randomThaiNationalId(),
      share_pct: 60
    },
    {
      name: 'Anan Jaidee',
      relationship: 'Child',
      national_id: randomThaiNationalId(),
      share_pct: 40
    }
  ];
}

/** Health declarations with no "Yes" answers (so no details are required). */
export function cleanHealthDeclarations() {
  return [
    { question_id: 'eapp.health.q1', answer: false, details: null },
    { question_id: 'eapp.health.q2', answer: false, details: null },
    { question_id: 'eapp.health.q3', answer: false, details: null }
  ];
}
