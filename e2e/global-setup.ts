import 'dotenv/config';
import { BASE_URL } from './fixtures/env';

async function waitFor(name: string, url: string, timeoutMs = 60_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	let lastErr = '';
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url, { redirect: 'follow' });
			if (res.ok) return;
			lastErr = `HTTP ${res.status}`;
		} catch (e) {
			lastErr = e instanceof Error ? e.message : String(e);
		}
		await new Promise((r) => setTimeout(r, 1000));
	}
	throw new Error(
		`\n\n✗ ${name} not reachable at ${url} (${lastErr}).\n` +
			`  The blackbox suite expects a running app. Start it first, e.g.:\n` +
			`    make up    # docker compose\n` +
			`    make dev   # native (pnpm dev)\n` +
			`  Or point the suite elsewhere via BASE_URL.\n`
	);
}

export default async function globalSetup() {
	await waitFor('app', `${BASE_URL}/api/healthz`);
	// Start every run from the deterministic seed.
	await fetch(`${BASE_URL}/api/admin/reset`, { method: 'POST' });
	// eslint-disable-next-line no-console
	console.log(`✓ app ${BASE_URL} (reset to seed)`);
}
