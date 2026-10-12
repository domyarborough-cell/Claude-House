#!/usr/bin/env node
// Optional always-on server: serves the dashboard, re-audits on a timer,
// and exposes POST /api/audit for on-demand runs from the "Run audit now" button.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditAndSave } from './audit/run.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'docs');
const PORT = Number(process.env.PORT || 8080);
const INTERVAL_MIN = Number(process.env.AUDIT_INTERVAL_MIN || 60);
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

let running = null;
let lastError = null;
function audit() {
  running ??= auditAndSave()
    .then(() => { lastError = null; })
    .catch((e) => { lastError = String(e); console.error(e); })
    .finally(() => { running = null; });
  return running;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ live: true, running: !!running, intervalMin: INTERVAL_MIN, lastError }));
  }
  if (url.pathname === '/api/audit' && req.method === 'POST') {
    await audit();
    res.writeHead(lastError ? 500 : 200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: !lastError, error: lastError }));
  }
  const path = normalize(join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (!path.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Dashboard on http://localhost:${PORT} — auditing every ${INTERVAL_MIN} min`);
  audit();
  setInterval(audit, INTERVAL_MIN * 60_000);
});
