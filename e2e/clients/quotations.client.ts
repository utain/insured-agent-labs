import { BaseResource } from './base.client';
import { Quotation, QuotationCalc, Illustration, type Gender, type Modal } from '../schemas';

export interface InsuredInput {
	full_name: string;
	dob: string;
	gender: Gender;
	occupation?: string;
}

/** Domain-friendly coverage (camelCase); mapped to the API's snake_case body. */
export interface CoverageInput {
	product: string;
	sumAssured: number;
	term: number;
	modal?: Modal;
	riders?: { code: string; sumAssured: number }[];
}

/** `/api/quotations` — draft a quotation, set coverage, price it, illustrate. */
export class QuotationsApi extends BaseResource {
	/** POST /api/quotations — from a fresh insured or an existing `lead_id`. */
	create(input: { insured?: InsuredInput; lead_id?: string }, opts: { expect?: number } = {}) {
		return this.http.post('/api/quotations', { data: input, schema: Quotation, expect: opts.expect });
	}

	/** GET /api/quotations/:id. */
	get(id: string, opts: { expect?: number } = {}) {
		return this.http.get(`/api/quotations/${id}`, { schema: Quotation, expect: opts.expect });
	}

	/** PUT /api/quotations/:id — set base plan + coverage + riders. */
	setCoverage(id: string, coverage: CoverageInput, opts: { expect?: number } = {}) {
		return this.http.put(`/api/quotations/${id}`, {
			data: {
				base_product_code: coverage.product,
				sum_assured: coverage.sumAssured,
				term: coverage.term,
				modal: coverage.modal ?? 'annual',
				riders: (coverage.riders ?? []).map((r) => ({ code: r.code, sum_assured: r.sumAssured }))
			},
			schema: Quotation,
			expect: opts.expect
		});
	}

	/** PUT /api/quotations/:id — seed product/coverage/riders from a template package. */
	applyPackage(id: string, packageId: string, opts: { expect?: number } = {}) {
		return this.http.put(`/api/quotations/${id}`, {
			data: { apply_package: packageId },
			schema: Quotation,
			expect: opts.expect
		});
	}

	/** POST /api/quotations/:id/calculate → the premium breakdown only. */
	calculate(id: string, opts: { expect?: number } = {}) {
		return this.http.post(`/api/quotations/${id}/calculate`, { schema: QuotationCalc, expect: opts.expect });
	}

	/** POST /api/quotations/:id/illustrate → the Sales Illustration. */
	illustrate(id: string, opts: { expect?: number } = {}) {
		return this.http.post(`/api/quotations/${id}/illustrate`, { schema: Illustration, expect: opts.expect });
	}
}
