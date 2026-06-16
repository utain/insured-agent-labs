import { BaseResource } from './base.client';
import { Illustration } from '../schemas';

/** `/api/illustrations` — the issued Sales Illustration documents. */
export class IllustrationsApi extends BaseResource {
	/** GET /api/illustrations/:id. */
	get(id: string, opts: { expect?: number } = {}) {
		return this.http.get(`/api/illustrations/${id}`, { schema: Illustration, expect: opts.expect });
	}
}
