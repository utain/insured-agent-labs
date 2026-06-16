import { BaseResource } from './base.client';
import { Ok, DebugState, Health } from '../schemas';

/** Open QA endpoints: health, deterministic reset, and store introspection. */
export class AdminApi extends BaseResource {
	/** GET /api/healthz. */
	health(opts: { expect?: number } = {}) {
		return this.http.get('/api/healthz', { schema: Health, expect: opts.expect });
	}

	/** POST /api/admin/reset → restore the deterministic seed. */
	reset(opts: { expect?: number } = {}) {
		return this.http.post('/api/admin/reset', { schema: Ok, expect: opts.expect });
	}

	/** GET /api/admin/debug-state → store entity counts. */
	debugState(opts: { expect?: number } = {}) {
		return this.http.get('/api/admin/debug-state', { schema: DebugState, expect: opts.expect });
	}
}
