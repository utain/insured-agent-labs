import { z } from 'zod';

/** POST /api/admin/reset. */
export const Ok = z.object({ ok: z.boolean() });
export type Ok = z.infer<typeof Ok>;

/** GET /api/healthz. */
export const Health = z.object({ status: z.literal('ok') });
export type Health = z.infer<typeof Health>;

/** GET /api/admin/debug-state — store entity counts. */
export const DebugState = z.object({
	users: z.number(),
	sessions: z.number(),
	leads: z.number(),
	packages: z.number(),
	quotations: z.number(),
	illustrations: z.number(),
	transactions: z.number(),
	products: z.number(),
	riders: z.number()
});
export type DebugState = z.infer<typeof DebugState>;
