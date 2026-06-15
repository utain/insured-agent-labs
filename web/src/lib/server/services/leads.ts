// Lead / customer management.

import type { CreateLeadRequest, Lead, UpdateLeadRequest, User } from '$lib/schemas';
import { ApiError } from '../api-error';
import { isValidThaiNationalId } from '../domain/validation';
import type { FieldError } from '../domain/validation';
import { db, newId } from '../store';
import { logTransaction } from './transactions';

export function listLeads(user: User): Lead[] {
	return [...db().leads.values()]
		.filter((l) => l.agent_id === user.id)
		.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getLead(user: User, id: string): Lead {
	const lead = db().leads.get(id);
	if (!lead || lead.agent_id !== user.id) throw ApiError.notFound('Lead not found');
	return lead;
}

function validateOptionalFields(input: { national_id?: string | null }): FieldError[] {
	const errors: FieldError[] = [];
	if (input.national_id && !isValidThaiNationalId(input.national_id)) {
		errors.push({ field: 'national_id', message: 'Invalid Thai national ID' });
	}
	return errors;
}

export function createLead(user: User, input: CreateLeadRequest): Lead {
	const errors = validateOptionalFields(input);
	if (errors.length) throw ApiError.validation(errors);

	const now = new Date().toISOString();
	const lead: Lead = {
		id: newId('lead'),
		agent_id: user.id,
		full_name: input.full_name,
		dob: input.dob,
		gender: input.gender,
		occupation: input.occupation ?? null,
		national_id: input.national_id ?? null,
		phone: input.phone ?? null,
		email: input.email ?? null,
		status: 'new',
		created_at: now,
		updated_at: now
	};
	db().leads.set(lead.id, lead);
	logTransaction({
		agentId: user.id,
		kind: 'lead',
		referenceId: lead.id,
		title: 'New Lead',
		summary: lead.full_name,
		status: lead.status
	});
	return lead;
}

export function updateLead(user: User, id: string, input: UpdateLeadRequest): Lead {
	const lead = getLead(user, id);
	const errors = validateOptionalFields(input);
	if (errors.length) throw ApiError.validation(errors);

	Object.assign(lead, {
		...(input.full_name !== undefined && { full_name: input.full_name }),
		...(input.dob !== undefined && { dob: input.dob }),
		...(input.gender !== undefined && { gender: input.gender }),
		...(input.occupation !== undefined && { occupation: input.occupation ?? null }),
		...(input.national_id !== undefined && { national_id: input.national_id ?? null }),
		...(input.phone !== undefined && { phone: input.phone ?? null }),
		...(input.email !== undefined && { email: input.email ?? null }),
		...(input.status !== undefined && { status: input.status }),
		updated_at: new Date().toISOString()
	});
	return lead;
}

export function deleteLead(user: User, id: string): void {
	const lead = getLead(user, id);
	db().leads.delete(lead.id);
}
