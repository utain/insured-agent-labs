import { BaseResource } from './base.client';
import { Lead } from '../schemas';
import type { LeadInput } from '../fixtures/data';

/** `/api/leads` — the agent's prospects. */
export class LeadsApi extends BaseResource {
	/** POST /api/leads. Bodies may be partial/invalid for negative paths via `expect`. */
	create(data: Partial<LeadInput>, opts: { expect?: number } = {}) {
		return this.http.post('/api/leads', { data, schema: Lead, expect: opts.expect });
	}

	/** GET /api/leads/:id. */
	get(id: string, opts: { expect?: number } = {}) {
		return this.http.get(`/api/leads/${id}`, { schema: Lead, expect: opts.expect });
	}

	/** GET /api/leads. */
	list(opts: { expect?: number } = {}) {
		return this.http.get('/api/leads', { schema: Lead.array(), expect: opts.expect });
	}
}
