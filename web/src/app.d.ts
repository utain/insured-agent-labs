// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from '$lib/schemas';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			apiToken: string | null;
		}
		interface Error {
			code: string;
			message: string;
		}
		interface PageData {
			user?: User;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
