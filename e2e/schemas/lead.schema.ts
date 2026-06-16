import { z } from 'zod';
import { Gender, LeadStatus } from './common.schema';

export const Lead = z.object({
	id: z.string(),
	agent_id: z.string(),
	full_name: z.string(),
	dob: z.string(),
	gender: Gender,
	occupation: z.string().nullable(),
	national_id: z.string().nullable(),
	phone: z.string().nullable(),
	email: z.string().nullable(),
	status: LeadStatus,
	created_at: z.string(),
	updated_at: z.string()
});
export type Lead = z.infer<typeof Lead>;
