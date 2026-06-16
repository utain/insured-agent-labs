import { z } from 'zod';
import { Modal } from './common.schema';
import { RiderSelection } from './quotation.schema';

export const Package = z.object({
	id: z.string(),
	agent_id: z.string().nullable(), // null = global template
	name: z.string(),
	description: z.string(),
	base_product_code: z.string(),
	default_sum_assured: z.number(),
	term: z.number(),
	modal: Modal,
	riders: z.array(RiderSelection),
	created_at: z.string(),
	updated_at: z.string()
});
export type Package = z.infer<typeof Package>;
