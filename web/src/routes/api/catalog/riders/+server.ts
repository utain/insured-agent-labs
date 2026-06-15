import type { RequestHandler } from './$types';
import { apiUser, respond } from '$lib/server/http';
import { listRiders } from '$lib/server/services/catalog';
import { RIDER_TYPES, type RiderType } from '$lib/schemas';

export const GET: RequestHandler = (event) =>
	respond(() => {
		apiUser(event);
		const type = event.url.searchParams.get('type') as RiderType | null;
		return listRiders(type && RIDER_TYPES.includes(type) ? type : undefined);
	});
