import 'dotenv/config';
import { API_BASE_URL, WEB_BASE_URL } from './fixtures/env';

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
      `  The blackbox suite expects a running stack. Start it first, e.g.:\n` +
      `    make up            # docker compose\n` +
      `    make dev-backend   # + make dev-web (native)\n` +
      `  Or point the suite elsewhere via API_BASE_URL / WEB_BASE_URL.\n`
  );
}

export default async function globalSetup() {
  await waitFor('backend', `${API_BASE_URL}/api/health`);
  await waitFor('web app', `${WEB_BASE_URL}/login`);
  // eslint-disable-next-line no-console
  console.log(`✓ backend ${API_BASE_URL}  ✓ web ${WEB_BASE_URL}`);
}
