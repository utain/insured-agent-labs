import type { RequestHandler } from './$types';
import { respond } from '$lib/server/http';
import { resetDb } from '$lib/server/store';

// QA reset. Open by design so automated suites can restore the deterministic seed.
export const POST: RequestHandler = () =>
	respond(() => {
		resetDb();
		return { ok: true };
	});
