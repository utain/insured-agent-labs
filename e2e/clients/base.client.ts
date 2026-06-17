// The HTTP layer the whole API Object Model sits on. One place attaches the bearer
// token, asserts the response status, and validates the body against a Zod schema.
// Resource clients (clients/*.client.ts) are thin typed facades over this — the API
// analog of how Page Objects (pages/*.page.ts) sit over Playwright's `page`.

import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import { ErrorBody, type ErrorBody as ErrorBodyType } from '../schemas';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestOptions<T> {
	/** JSON request body. */
	data?: unknown;
	/** Query-string params (e.g. `{ kind: 'illustration' }`). */
	params?: Record<string, string | number | boolean>;
	/** Expected HTTP status. Defaults to 200 (or 204 for `del`). */
	expect?: number;
	/** Zod schema for the success body — validates the contract and types the return. */
	schema?: ZodType<T>;
}

export class HttpClient {
	constructor(
		private readonly ctx: APIRequestContext,
		private readonly token?: string
	) {}

	get<T = unknown>(path: string, opts: RequestOptions<T> = {}): Promise<T> {
		return this.call('get', path, opts, 200);
	}
	post<T = unknown>(path: string, opts: RequestOptions<T> = {}): Promise<T> {
		return this.call('post', path, opts, 200);
	}
	put<T = unknown>(path: string, opts: RequestOptions<T> = {}): Promise<T> {
		return this.call('put', path, opts, 200);
	}
	del<T = unknown>(path: string, opts: RequestOptions<T> = {}): Promise<T> {
		return this.call('delete', path, opts, 204);
	}

	/** Escape hatch: the raw Playwright response, asserting nothing. */
	send(method: HttpMethod, path: string, opts: RequestOptions<unknown> = {}): Promise<APIResponse> {
		return this.ctx[method](path, { headers: this.headers(), data: opts.data, params: opts.params });
	}

	private async call<T>(
		method: HttpMethod,
		path: string,
		opts: RequestOptions<T>,
		defaultStatus: number
	): Promise<T> {
		const expected = opts.expect ?? defaultStatus;
		const res = await this.send(method, path, opts);
		const status = res.status();
		expect(status, `${method.toUpperCase()} ${path} → ${status} (expected ${expected})`).toBe(expected);

		if (status === 204) return undefined as T;

		const text = await res.text();
		let body: unknown;
		try {
			body = JSON.parse(text);
		} catch {
			throw new Error(
				`${method.toUpperCase()} ${path} → ${status}: expected a JSON body but received:\n${text.slice(0, 500)}`
			);
		}
		// Every 4xx/5xx shares one envelope — validate it even when a success schema was passed.
		const schema = expected >= 400 ? ErrorBody : opts.schema;
		if (!schema) return body as T;

		const parsed = schema.safeParse(body);
		if (!parsed.success) {
			throw new Error(
				`Response contract mismatch: ${method.toUpperCase()} ${path}\n` +
					parsed.error.issues
						.map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
						.join('\n') +
					`\n\nReceived:\n${JSON.stringify(body, null, 2)}`
			);
		}
		return parsed.data as T;
	}

	private headers(): Record<string, string> | undefined {
		return this.token ? { Authorization: `Bearer ${this.token}` } : undefined;
	}
}

/** Base class for resource clients. The API analog of `BasePage`. */
export abstract class BaseResource {
	constructor(protected readonly http: HttpClient) {}
}

/**
 * Re-type a negative-path call as the error envelope.
 *
 * Resource methods always return their *success* type, but when you pass
 * `{ expect: 4xx }` the body is actually the validated `ErrorBody`. Wrap such a
 * call in `expectError(...)` to read `.error.code` / `.error.fields` type-safely.
 */
export async function expectError(call: Promise<unknown>): Promise<ErrorBodyType> {
	return (await call) as ErrorBodyType;
}
