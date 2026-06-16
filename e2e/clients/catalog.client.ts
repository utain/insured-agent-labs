import { BaseResource } from './base.client';
import { CatalogProduct, CatalogRiderPlan, type RiderType } from '../schemas';

/** `/api/catalog` — the read-only product & rider catalog. */
export class CatalogApi extends BaseResource {
	/** GET /api/catalog/products. */
	products(opts: { expect?: number } = {}) {
		return this.http.get('/api/catalog/products', { schema: CatalogProduct.array(), expect: opts.expect });
	}

	/** GET /api/catalog/products/:code. */
	product(code: string, opts: { expect?: number } = {}) {
		return this.http.get(`/api/catalog/products/${code}`, { schema: CatalogProduct, expect: opts.expect });
	}

	/** GET /api/catalog/riders, optionally filtered by rider type. */
	riders(filter: { type?: RiderType } = {}, opts: { expect?: number } = {}) {
		return this.http.get('/api/catalog/riders', {
			schema: CatalogRiderPlan.array(),
			params: filter.type ? { type: filter.type } : undefined,
			expect: opts.expect
		});
	}
}
