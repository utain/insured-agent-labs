export const SESSION_COOKIE = 'session';

/** Page routes that don't require authentication. (API routes enforce their own auth.) */
export const PUBLIC_PATHS = ['/login', '/api-docs'];

/** Liveness endpoint. */
export const HEALTH_PATH = '/api/healthz';
