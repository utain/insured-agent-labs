// Server-only API client. This module lives under `src/lib/server` so SvelteKit
// guarantees it is never shipped to the browser.
import type {
	Beneficiary,
	CatalogProduct,
	CatalogRiderPlan,
	CreateLeadRequest,
	CreateQuotationRequest,
	EApplication,
	ErrorEnvelope,
	HealthDeclaration,
	Lead,
	LoginRequest,
	LoginResponse,
	Payment,
	PaymentMethod,
	PaymentStatus,
	Quotation,
	QuotationCalc,
	RiderType,
	TransactionKind,
	TransactionPage,
	UpdateQuotationRequest,
	User
} from '$lib/types';

const API_BASE = process.env.RUST_API_URL ?? 'http://localhost:3000';

/** Thrown to callers; maps directly to App.Error. */
export class ApiCallError extends Error {
	readonly code: string;
	readonly status: number;
	readonly fields?: { field: string; message: string }[];
	readonly headers?: Headers;

	constructor(envelope: ErrorEnvelope, status: number, headers?: Headers) {
		super(envelope.error.message);
		this.name = 'ApiCallError';
		this.code = envelope.error.code;
		this.status = status;
		this.fields = envelope.error.fields;
		this.headers = headers;
	}
}

export interface ApiCallOptions {
	token?: string | null;
	/** For mutations: the JSON body. */
	body?: unknown;
	/** HTTP method; default GET (or POST if body set). */
	method?: string;
	/** Query params. */
	query?: Record<string, string | string[] | undefined>;
}

/** Low-level call. Throws ApiCallError on non-2xx. */
async function call<T>(path: string, opts: ApiCallOptions = {}): Promise<T> {
	const url = new URL(API_BASE + path);
	if (opts.query) {
		for (const [k, v] of Object.entries(opts.query)) {
			if (v === undefined) continue;
			if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
			else url.searchParams.set(k, v);
		}
	}
	const init: RequestInit = {
		method: opts.method ?? (opts.body ? 'POST' : 'GET'),
		headers: {} as Record<string, string>
	};
	if (opts.token)
		(init.headers as Record<string, string>)['Authorization'] = `Bearer ${opts.token}`;
	if (opts.body !== undefined) {
		(init.headers as Record<string, string>)['Content-Type'] = 'application/json';
		init.body = JSON.stringify(opts.body);
	}
	const res = await fetch(url.toString(), init);
	const text = await res.text();
	const json = text ? JSON.parse(text) : null;
	if (!res.ok) {
		throw new ApiCallError(json as ErrorEnvelope, res.status, res.headers);
	}
	return json as T;
}

// ===== Auth =====

export const authApi = {
	login: (req: LoginRequest) => call<LoginResponse>('/api/auth/login', { body: req }),
	logout: (token: string) => call<void>('/api/auth/logout', { method: 'POST', token }),
	me: (token: string) => call<User>('/api/auth/me', { token })
};

// ===== Catalog =====

export const catalogApi = {
	products: (token: string) => call<CatalogProduct[]>('/api/catalog/products', { token }),
	product: (token: string, code: string) =>
		call<CatalogProduct>(`/api/catalog/products/${encodeURIComponent(code)}`, { token }),
	riders: (token: string, type?: RiderType) =>
		call<CatalogRiderPlan[]>('/api/catalog/riders', { token, query: { type } }),
	rider: (token: string, code: string) =>
		call<CatalogRiderPlan>(`/api/catalog/riders/${encodeURIComponent(code)}`, { token })
};

// ===== Leads =====

export const leadsApi = {
	list: (token: string) => call<Lead[]>('/api/leads', { token }),
	create: (token: string, req: CreateLeadRequest) => call<Lead>('/api/leads', { body: req, token }),
	get: (token: string, id: string) => call<Lead>(`/api/leads/${id}`, { token }),
	update: (token: string, id: string, req: Partial<CreateLeadRequest>) =>
		call<Lead>(`/api/leads/${id}`, { method: 'PUT', body: req, token }),
	delete: (token: string, id: string) => call<void>(`/api/leads/${id}`, { method: 'DELETE', token })
};

// ===== Quotations =====

export const quotationsApi = {
	list: (token: string) => call<Quotation[]>('/api/quotations', { token }),
	create: (token: string, req: CreateQuotationRequest) =>
		call<Quotation>('/api/quotations', { body: req, token }),
	get: (token: string, id: string) => call<Quotation>(`/api/quotations/${id}`, { token }),
	update: (token: string, id: string, req: UpdateQuotationRequest) =>
		call<Quotation>(`/api/quotations/${id}`, { method: 'PUT', body: req, token }),
	calculate: (token: string, id: string) =>
		call<QuotationCalc>(`/api/quotations/${id}/calculate`, { method: 'POST', token }),
	finalize: (token: string, id: string) =>
		call<Quotation>(`/api/quotations/${id}/finalize`, { method: 'POST', token })
};

// ===== E-Apps =====

export const eappsApi = {
	create: (token: string, quotationId: string) =>
		call<EApplication>('/api/eapps', { body: { quotation_id: quotationId }, token }),
	get: (token: string, id: string) => call<EApplication>(`/api/eapps/${id}`, { token }),
	update: (
		token: string,
		id: string,
		body: { beneficiaries: Beneficiary[]; health_declarations: HealthDeclaration[] }
	) => call<EApplication>(`/api/eapps/${id}`, { method: 'PUT', body, token }),
	submit: (token: string, id: string) =>
		call<EApplication>(`/api/eapps/${id}/submit`, { method: 'POST', token })
};

// ===== Payments =====

export const paymentsApi = {
	create: (
		token: string,
		body: { eapp_id: string; method: PaymentMethod; outcome?: PaymentStatus }
	) => call<Payment>('/api/payments', { body, token }),
	get: (token: string, id: string) => call<Payment>(`/api/payments/${id}`, { token })
};

// ===== Transactions =====

export const transactionsApi = {
	list: (
		token: string,
		filters?: {
			kind?: TransactionKind[];
			status?: string[];
			search?: string;
			page?: number;
			page_size?: number;
		}
	) =>
		call<TransactionPage>('/api/transactions', {
			token,
			query: {
				kind: filters?.kind,
				status: filters?.status,
				search: filters?.search,
				page: filters?.page?.toString(),
				page_size: filters?.page_size?.toString()
			}
		})
};
