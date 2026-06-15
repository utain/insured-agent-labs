// Read-only catalog access.

import type { CatalogProduct, CatalogRiderPlan, RiderType } from '$lib/schemas';
import { ApiError } from '../api-error';
import { db } from '../store';

export function listProducts(): CatalogProduct[] {
	return db().products;
}

export function getProduct(code: string): CatalogProduct {
	const p = db().products.find((x) => x.code === code);
	if (!p) throw ApiError.notFound(`Product ${code} not found`);
	return p;
}

export function findProduct(code: string): CatalogProduct | undefined {
	return db().products.find((x) => x.code === code);
}

export function listRiders(type?: RiderType): CatalogRiderPlan[] {
	const all = db().riders;
	return type ? all.filter((r) => r.rider_type === type) : all;
}

export function getRider(code: string): CatalogRiderPlan {
	const r = db().riders.find((x) => x.code === code);
	if (!r) throw ApiError.notFound(`Rider ${code} not found`);
	return r;
}

export function findRider(code: string): CatalogRiderPlan | undefined {
	return db().riders.find((x) => x.code === code);
}
