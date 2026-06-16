import { z } from 'zod';

export const User = z.object({
	id: z.string(),
	username: z.string(),
	display_name: z.string(),
	role: z.enum(['agent', 'admin']),
	scenario_flag: z.enum(['standard', 'locked', 'glitch', 'bug', 'error'])
});
export type User = z.infer<typeof User>;

/** POST /api/auth/login response. */
export const LoginResponse = z.object({
	token: z.string(),
	user: User
});
export type LoginResponse = z.infer<typeof LoginResponse>;
