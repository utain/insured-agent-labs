// In-memory store. A module singleton stashed on globalThis so it survives Vite
// HMR in dev and is shared across requests in the single Node process.

import { seed, type Db } from './seed';

const KEY = Symbol.for('insured-agent-labs.db');

type Global = typeof globalThis & { [KEY]?: Db };
const g = globalThis as Global;

if (!g[KEY]) {
	g[KEY] = seed();
}

export function db(): Db {
	return g[KEY]!;
}

/** Re-seed to the deterministic baseline (QA reset). */
export function resetDb(): void {
	g[KEY] = seed();
}

let counter = 0;
/** Monotonic-ish unique id for runtime-created entities. */
export function newId(prefix: string): string {
	counter += 1;
	return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function newToken(): string {
	return `tok_${crypto.randomUUID().replace(/-/g, '')}`;
}
