#!/usr/bin/env node
// CLI: run one audit and write docs/data/latest.json + append docs/data/history.json
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './audit.mjs';

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'data');
const HISTORY_LIMIT = 2000; // ~83 days of hourly runs

export async function auditAndSave(opts = {}) {
  const report = await runAudit({
    site: opts.site || process.env.SITE_URL || 'https://careficient.com/',
    brand: opts.brand || process.env.BRAND || 'Careficient',
    maxPages: Number(opts.maxPages || process.env.MAX_PAGES || 25),
    log: opts.log || console.log,
  });
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(join(DATA_DIR, 'latest.json'), JSON.stringify(report, null, 1));

  let history = [];
  try { history = JSON.parse(await readFile(join(DATA_DIR, 'history.json'), 'utf8')); } catch {}
  history.push({ at: report.generatedAt, ...report.scores, ...report.totals });
  await writeFile(join(DATA_DIR, 'history.json'), JSON.stringify(history.slice(-HISTORY_LIMIT)));
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await auditAndSave();
  console.log(`\nOverall ${r.scores.overall} · SEO ${r.scores.seo} · AEO ${r.scores.aeo} · GEO ${r.scores.geo} · ${r.totals.pages} pages · ${r.totals.fail} fails`);
}
