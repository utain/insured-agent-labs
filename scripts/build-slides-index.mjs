#!/usr/bin/env node
// Generates slides/index.html — a landing page listing every deck in slides/.
// Re-run whenever decks are added/removed (CI does this automatically on deploy).
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const slidesDir = join(dirname(fileURLToPath(import.meta.url)), "..", "slides");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Turn a filename into a readable title, e.g.
// "Playwright Automation Excellence - Session 1 - Deck.html" -> deck + session.
function parse(file) {
  const base = file.replace(/\.html$/i, "");
  const title = base.replace(/\s*[-–]\s*Deck$/i, "").trim();
  return { file, title };
}

const decks = readdirSync(slidesDir)
  .filter((f) => /\.html$/i.test(f) && f.toLowerCase() !== "index.html")
  .sort((a, b) => a.localeCompare(b))
  .map((file) => {
    const { mtime } = statSync(join(slidesDir, file));
    return { ...parse(file), mtime };
  });

const cards = decks
  .map(({ file, title, mtime }) => {
    const date = mtime.toISOString().slice(0, 10);
    return `      <a class="card" href="./${esc(encodeURI(file))}">
        <span class="card-title">${esc(title)}</span>
        <span class="card-meta">Updated ${date}</span>
      </a>`;
  })
  .join("\n");

const empty = `      <p class="empty">No decks yet — drop an .html deck into slides/ and redeploy.</p>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slides</title>
  <style>
    :root { --teal: #0e94ac; --teal-bright: #14b6cf; --ink: #0f1a29; --muted: #5b6b7e; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
      background: #f6f8fc; color: var(--ink); min-height: 100vh;
      padding: 64px 24px;
    }
    .wrap { max-width: 880px; margin: 0 auto; }
    header { margin-bottom: 40px; }
    h1 { font-size: 40px; font-weight: 800; letter-spacing: -0.02em; }
    h1 .dot { color: var(--teal-bright); }
    .sub { color: var(--muted); margin-top: 8px; font-size: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card {
      display: flex; flex-direction: column; gap: 10px;
      background: #fff; border: 1px solid #e6ebf2; border-radius: 14px;
      padding: 22px 24px; text-decoration: none; color: inherit;
      box-shadow: 0 1px 3px rgba(15,26,41,0.05);
      transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(14,148,172,0.15); border-color: var(--teal-bright); }
    .card-title { font-size: 18px; font-weight: 700; line-height: 1.3; }
    .card-meta { font-size: 13px; color: var(--muted); }
    .empty { color: var(--muted); font-size: 16px; }
    footer { margin-top: 48px; color: var(--muted); font-size: 13px; }
    footer a { color: var(--teal); }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Slides<span class="dot">.</span></h1>
      <p class="sub">${decks.length} deck${decks.length === 1 ? "" : "s"}</p>
    </header>
    <main class="grid">
${decks.length ? cards : empty}
    </main>
    <footer>
      Built from <a href="https://github.com/utain/insured-agent-labs/tree/main/slides">slides/</a>.
    </footer>
  </div>
</body>
</html>
`;

writeFileSync(join(slidesDir, "index.html"), html);
console.log(`Generated slides/index.html with ${decks.length} deck(s).`);
