// Shared error type for services. Carries an HTTP status + machine code + optional
// field errors, and serializes to the { error: {...} } envelope used everywhere.

import type { FieldError } from './domain/validation';

export interface ErrorEnvelope {
	error: { code: string; message: string; fields?: FieldError[] };
}

export class ApiError extends Error {
	status: number;
	code: string;
	fields?: FieldError[];

	constructor(status: number, code: string, message: string, fields?: FieldError[]) {
		super(message);
		this.status = status;
		this.code = code;
		this.fields = fields;
	}

	envelope(): ErrorEnvelope {
		return { error: { code: this.code, message: this.message, fields: this.fields } };
	}

	static unauthorized(message = 'Authentication required') {
		return new ApiError(401, 'unauthorized', message);
	}
	static forbidden(message = 'Forbidden') {
		return new ApiError(403, 'forbidden', message);
	}
	static notFound(message = 'Not found') {
		return new ApiError(404, 'not_found', message);
	}
	static conflict(message: string) {
		return new ApiError(409, 'conflict', message);
	}
	static locked(message = 'This account is locked') {
		return new ApiError(423, 'locked', message);
	}
	static validation(fields: FieldError[], message = 'Validation failed') {
		return new ApiError(422, 'validation', message, fields);
	}
	static server(message = 'Internal server error') {
		return new ApiError(500, 'server_error', message);
	}
}
