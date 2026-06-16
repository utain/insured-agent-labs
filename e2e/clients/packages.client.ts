import { BaseResource } from './base.client';
import { Package, type Modal } from '../schemas';

export interface PackageInput {
	name: string;
	description: string;
	base_product_code: string;
	default_sum_assured: number;
	term: number;
	modal: Modal;
	riders: { code: string; sum_assured: number }[];
}

/** `/api/packages` — reusable product/coverage bundles (templates + agent-owned). */
export class PackagesApi extends BaseResource {
	/** GET /api/packages. */
	list(opts: { expect?: number } = {}) {
		return this.http.get('/api/packages', { schema: Package.array(), expect: opts.expect });
	}

	/** POST /api/packages. Bodies may be partial/invalid for negative paths via `expect`. */
	create(data: Partial<PackageInput>, opts: { expect?: number } = {}) {
		return this.http.post('/api/packages', { data, schema: Package, expect: opts.expect });
	}

	/** PUT /api/packages/:id (accepts a full package spread or a partial patch). */
	update(id: string, data: Partial<PackageInput>, opts: { expect?: number } = {}) {
		return this.http.put(`/api/packages/${id}`, { data, schema: Package, expect: opts.expect });
	}

	/** DELETE /api/packages/:id → 204. */
	remove(id: string, opts: { expect?: number } = {}): Promise<void> {
		return this.http.del(`/api/packages/${id}`, { expect: opts.expect });
	}
}
