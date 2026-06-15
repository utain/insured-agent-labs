// Package management: agents bundle a base plan + riders + default coverage as a
// reusable "game plan" to present to customers and to seed quotations.

import type { CreatePackageRequest, Package, UpdatePackageRequest, User } from '$lib/schemas';
import { ApiError } from '../api-error';
import type { FieldError } from '../domain/validation';
import { db, newId } from '../store';
import { findProduct, findRider } from './catalog';

/** Visible packages = global templates (agent_id null) + the agent's own. */
export function listPackages(user: User): Package[] {
	return [...db().packages.values()]
		.filter((p) => p.agent_id === null || p.agent_id === user.id)
		.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getPackage(user: User, id: string): Package {
	const pkg = db().packages.get(id);
	if (!pkg || (pkg.agent_id !== null && pkg.agent_id !== user.id)) {
		throw ApiError.notFound('Package not found');
	}
	return pkg;
}

function validate(input: {
	base_product_code?: string;
	riders?: { code: string }[];
}): FieldError[] {
	const errors: FieldError[] = [];
	if (input.base_product_code && !findProduct(input.base_product_code)) {
		errors.push({ field: 'base_product_code', message: 'Unknown base product' });
	}
	for (const r of input.riders ?? []) {
		if (!findRider(r.code)) {
			errors.push({ field: `rider.${r.code}`, message: `Unknown rider ${r.code}` });
		}
	}
	return errors;
}

export function createPackage(user: User, input: CreatePackageRequest): Package {
	const errors = validate(input);
	if (errors.length) throw ApiError.validation(errors);

	const now = new Date().toISOString();
	const pkg: Package = {
		id: newId('pkg'),
		agent_id: user.id,
		name: input.name,
		description: input.description ?? '',
		base_product_code: input.base_product_code,
		default_sum_assured: input.default_sum_assured,
		term: input.term,
		modal: input.modal ?? 'annual',
		riders: input.riders ?? [],
		created_at: now,
		updated_at: now
	};
	db().packages.set(pkg.id, pkg);
	return pkg;
}

export function updatePackage(user: User, id: string, input: UpdatePackageRequest): Package {
	const pkg = getPackage(user, id);
	if (pkg.agent_id === null) {
		throw ApiError.forbidden('Template packages cannot be edited');
	}
	const errors = validate(input);
	if (errors.length) throw ApiError.validation(errors);

	Object.assign(pkg, {
		...(input.name !== undefined && { name: input.name }),
		...(input.description !== undefined && { description: input.description }),
		...(input.base_product_code !== undefined && { base_product_code: input.base_product_code }),
		...(input.default_sum_assured !== undefined && {
			default_sum_assured: input.default_sum_assured
		}),
		...(input.term !== undefined && { term: input.term }),
		...(input.modal !== undefined && { modal: input.modal }),
		...(input.riders !== undefined && { riders: input.riders }),
		updated_at: new Date().toISOString()
	});
	return pkg;
}

export function deletePackage(user: User, id: string): void {
	const pkg = getPackage(user, id);
	if (pkg.agent_id === null) throw ApiError.forbidden('Template packages cannot be deleted');
	db().packages.delete(pkg.id);
}
