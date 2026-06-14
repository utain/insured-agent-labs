// Hand-synced with Rust DTOs in backend/src/db.rs + auth/mod.rs.
// Keep these in sync when backend entities change.

export type Role = 'agent' | 'admin';
export type ScenarioFlag = 'standard' | 'locked' | 'glitch' | 'bug' | 'error';
export type Locale = 'en' | 'th';
export type Gender = 'male' | 'female' | 'other';

export type LeadStatus = 'new' | 'contacted' | 'quoted';
export type QuotationStatus = 'draft' | 'quoted' | 'eapp' | 'paid' | 'submitted' | 'expired';
export type EAppStatus = 'created' | 'submitted';
export type PaymentStatus = 'success' | 'declined' | 'pending';
export type PaymentMethod = 'card' | 'bank_transfer' | 'promptpay';
export type Modal = 'annual' | 'semi' | 'quarterly' | 'monthly';
export type RiderType = 'health' | 'ci' | 'pa' | 'tpd' | 'wp';
export type TransactionKind = 'lead' | 'quotation' | 'eapp' | 'payment' | 'policy';

export interface User {
	id: string;
	username: string;
	display_name_en: string;
	display_name_th: string;
	role: Role;
	scenario_flag: ScenarioFlag;
	locale: Locale;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: User;
}

export interface CatalogProduct {
	code: string;
	name_en: string;
	name_th: string;
	description_en: string;
	description_th: string;
	min_age: number;
	max_age: number;
	min_sum_assured: number;
	max_sum_assured: number;
	term_options: number[];
	/** Per-age base annual rate (premium per 1000 sum assured). */
	rate_per_thousand: [number, number][];
}

export interface CatalogRiderPlan {
	code: string;
	rider_type: RiderType;
	name_en: string;
	name_th: string;
	min_age: number;
	max_age: number;
	sum_assured_options: number[];
	flat_premium: number | null;
	rate_per_thousand: [number, number][] | null;
}

export interface ErrorEnvelope {
	error: {
		code: string;
		message: string;
		fields?: { field: string; message: string }[];
	};
}

// ===== Leads =====

export interface Lead {
	id: string;
	agent_id: string;
	full_name: string;
	national_id: string;
	dob: string; // ISO date
	gender: Gender;
	phone: string;
	email: string | null;
	occupation: string | null;
	income: number | null;
	status: LeadStatus;
	created_at: string;
	updated_at: string;
}

export interface CreateLeadRequest {
	full_name: string;
	national_id: string;
	dob: string;
	gender: Gender;
	phone: string;
	email?: string | null;
	occupation?: string | null;
	income?: number | null;
}

// ===== Quotations =====

export interface RiderSelection {
	code: string;
	sum_assured: number;
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
	lead_id: string;
	agent_id: string;
	base_product_code: string;
	insured_name: string;
	insured_age: number;
	sum_assured: number;
	term: number;
	modal: Modal;
	riders: RiderSelection[];
	calc: QuotationCalc | null;
	status: QuotationStatus;
	valid_until: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateQuotationRequest {
	lead_id: string;
	base_product_code: string;
}

export interface UpdateQuotationRequest {
	sum_assured?: number;
	term?: number;
	modal?: Modal;
	riders?: RiderSelection[];
}

// ===== E-Applications =====

export interface Beneficiary {
	name: string;
	relationship: string;
	national_id: string;
	share_pct: number;
}

export interface HealthDeclaration {
	question_id: string;
	answer: boolean;
	details?: string | null;
}

export interface EApplication {
	id: string;
	quotation_id: string;
	lead_id: string;
	agent_id: string;
	beneficiaries: Beneficiary[];
	health_declarations: HealthDeclaration[];
	payment_id: string | null;
	status: EAppStatus;
	submitted_at: string | null;
	policy_number: string | null;
	created_at: string;
	updated_at: string;
}

// ===== Payments =====

export interface Payment {
	id: string;
	eapp_id: string;
	amount: number;
	method: PaymentMethod;
	status: PaymentStatus;
	transaction_ref: string;
	created_at: string;
}

// ===== Transactions =====

export interface Transaction {
	id: string;
	agent_id: string;
	kind: TransactionKind;
	reference_id: string;
	title_en: string;
	title_th: string;
	summary_en: string;
	summary_th: string;
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
