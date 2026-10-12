import { auditPage, parseRobots, botBlocked, AI_BOTS, check } from './checks.mjs';
import { findTags, sameSite } from './html.mjs';

const UA = 'Mozilla/5.0 (compatible; CareficientSiteAudit/1.0; +https://github.com/domyarborough-cell/Claude-House)';
const GPTBOT_UA = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)';

async function get(url, { ua = UA, redirect = 'follow', timeout = 20000 } = {}) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { redirect, headers: { 'user-agent': ua, accept: 'text/html,application/xhtml+xml,*/*' }, signal: AbortSignal.timeout(timeout) });
    const body = redirect === 'manual' ? '' : await res.text();
    const headers = Object.fromEntries(res.headers.entries());
    return { ok: res.ok, status: res.status, url: res.url || url, headers, body, timeMs: Math.round(performance.now() - t0) };
  } catch (e) {
    return { ok: false, status: 0, url, headers: {}, body: '', timeMs: Math.round(performance.now() - t0), error: e.cause?.code || e.name || String(e) };
  }
}

async function sitemapUrls(site, robots) {
  const candidates = [...new Set([...robots.sitemaps, new URL('/sitemap.xml', site).href, new URL('/sitemap_index.xml', site).href])];
  const urls = new Set();
  let found = null;
  const queue = [...candidates];
  const seen = new Set();
  while (queue.length && seen.size < 15) {
    const sm = queue.shift();
    if (seen.has(sm)) continue;
    seen.add(sm);
    const r = await get(sm);
    if (!r.ok || !/<(urlset|sitemapindex)\b/i.test(r.body)) continue;
    found ??= sm;
    const locs = [...r.body.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+)/gi)].map((m) => m[1].trim());
    if (/<sitemapindex\b/i.test(r.body)) queue.push(...locs);
    else locs.forEach((u) => urls.add(u));
  }
  return { found, urls: [...urls] };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

const STATUS_SCORE = { pass: 1, warn: 0.5, fail: 0 };

export function score(checks) {
  let num = 0;
  let den = 0;
  for (const c of checks) { num += STATUS_SCORE[c.status] * c.weight; den += c.weight; }
  return den ? Math.round((num / den) * 100) : null;
}

export async function runAudit({ site, maxPages = 25, brand = 'Careficient', concurrency = 4, log = () => {} }) {
  const started = Date.now();
  site = new URL(site).href;
  const origin = new URL(site).origin;
  const siteChecks = [];
  const add = (...a) => siteChecks.push(check(...a));

  // --- Homepage + reachability
  log(`Fetching ${site}`);
  const home = await get(site);
  if (!home.ok) log(`  homepage failed: ${home.status} ${home.error || ''}`);

  // --- robots.txt
  const robotsRes = await get(new URL('/robots.txt', origin).href);
  const robots = robotsRes.ok ? parseRobots(robotsRes.body) : { groups: [], sitemaps: [] };
  add('seo', 'robots-txt', 'robots.txt reachable', robotsRes.ok ? 'pass' : 'warn', robotsRes.ok ? 'Found' : `Status ${robotsRes.status}`,
    'Publish a robots.txt that references your sitemap.', 1);

  // --- sitemap
  const sm = await sitemapUrls(origin, robots);
  add('seo', 'sitemap', 'XML sitemap', sm.found ? 'pass' : 'fail', sm.found ? `${sm.found} (${sm.urls.length} URLs)` : 'No sitemap found',
    'Publish /sitemap.xml and reference it in robots.txt and Search Console / Bing Webmaster.', 3);

  // --- HTTP -> HTTPS
  const httpRes = await get(site.replace(/^https:/, 'http:'), { redirect: 'manual' });
  const loc = httpRes.headers.location || '';
  const redirects = [301, 308].includes(httpRes.status) && loc.startsWith('https://');
  add('seo', 'https-redirect', 'HTTP permanently redirects to HTTPS', redirects ? 'pass' : [302, 307].includes(httpRes.status) ? 'warn' : 'fail',
    httpRes.status ? `${httpRes.status} → ${loc || '(none)'}` : `Unreachable (${httpRes.error})`, 'Use a 301 redirect from http:// to https://.', 2);

  // --- Soft 404
  const nf = await get(new URL(`/__audit-404-check-${Date.now()}`, origin).href);
  add('seo', 'soft-404', 'Missing pages return 404', nf.status === 404 || nf.status === 410 ? 'pass' : 'fail', `Random URL returned ${nf.status}`,
    'Return a real 404 status for unknown URLs (soft 404s waste crawl budget).', 1);

  // --- AI crawler access (GEO)
  const blocked = AI_BOTS.filter((b) => botBlocked(robots, b));
  add('geo', 'ai-crawlers-robots', 'AI crawlers allowed in robots.txt', blocked.length === 0 ? 'pass' : blocked.length <= 2 ? 'warn' : 'fail',
    blocked.length ? `Blocked: ${blocked.join(', ')}` : `All ${AI_BOTS.length} AI/answer-engine bots allowed`,
    'Allow GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended etc. if you want to appear in AI answers.', 3);

  const botFetch = await get(site, { ua: GPTBOT_UA });
  const botOk = botFetch.ok && botFetch.body.length > home.body.length * 0.5;
  add('geo', 'ai-crawler-firewall', 'AI bots not blocked by firewall/CDN', botOk ? 'pass' : 'fail',
    `GPTBot user-agent got ${botFetch.status}${botFetch.error ? ` (${botFetch.error})` : ''}, ${botFetch.body.length.toLocaleString()} bytes`,
    'Check Cloudflare/WAF "AI bot" blocking — robots.txt may allow bots while the CDN rejects them.', 3);

  const llms = await get(new URL('/llms.txt', origin).href);
  const llmsOk = llms.ok && !/<html/i.test(llms.body.slice(0, 500)) && llms.body.trim().length > 50;
  add('geo', 'llms-txt', 'llms.txt published', llmsOk ? 'pass' : 'warn', llmsOk ? `${llms.body.length} bytes` : `Status ${llms.status}${llms.ok ? ' (not a valid llms.txt)' : ''}`,
    'Publish /llms.txt — a markdown summary of who you are and links to your key pages for LLMs.', 1);

  // --- Choose pages to crawl
  const originHost = new URL(origin).host;
  // Sitemaps often list www.* while the site serves the apex (or vice versa): treat both as this site.
  const onSite = (u) => { try { const x = new URL(u); if (!sameSite(x.host, originHost)) return null; x.host = originHost; x.hash = ''; return x.href; } catch { return null; } };
  let pageUrls = sm.urls.map(onSite).filter(Boolean);
  if (!pageUrls.length && home.ok) {
    pageUrls = findTags(home.body, 'a').map((a) => { try { return onSite(new URL(a.href, site).href); } catch { return null; } })
      .filter((u) => u && !/\.(pdf|jpe?g|png|gif|svg|webp|zip)$/i.test(u));
  }
  pageUrls = [...new Set([site, ...pageUrls])].slice(0, maxPages);
  log(`Auditing ${pageUrls.length} pages`);

  const pages = await pool(pageUrls, concurrency, async (u) => {
    const r = u === site ? home : await get(u);
    const isHtml = /html/i.test(r.headers['content-type'] || 'text/html');
    const res = r.status && isHtml
      ? auditPage({ url: r.url || u, status: r.status, timeMs: r.timeMs, headers: r.headers, html: r.body, brand })
      : { checks: [check('seo', 'http-status', 'HTTP 200 response', 'fail', r.error || `Status ${r.status}`, 'Fix or remove this URL from the sitemap.', 3)], title: '', words: 0, schemaTypes: [] };
    log(`  ${r.status} ${u}`);
    return {
      url: u, status: r.status, timeMs: r.timeMs, bytes: r.body.length, title: res.title, words: res.words, schemaTypes: res.schemaTypes,
      scores: { seo: score(res.checks.filter((c) => c.category === 'seo')), aeo: score(res.checks.filter((c) => c.category === 'aeo')), geo: score(res.checks.filter((c) => c.category === 'geo')) },
      checks: res.checks,
    };
  });

  // --- Site-wide AEO signals derived from pages
  const faqPages = pages.filter((p) => p.schemaTypes.some((t) => ['FAQPage', 'QAPage', 'HowTo'].includes(t))).length;
  add('aeo', 'faq-coverage', 'Site has FAQ / Q&A content', faqPages >= 2 ? 'pass' : faqPages === 1 ? 'warn' : 'fail', `${faqPages}/${pages.length} pages with Q&A schema`,
    'Build FAQ sections for core services (home health, hospice, billing, OASIS…) with FAQPage schema.', 2);
  const homeOrg = pages[0]?.schemaTypes.some((t) => ['Organization', 'Corporation', 'MedicalOrganization'].includes(t));
  add('geo', 'home-organization', 'Homepage Organization schema', homeOrg ? 'pass' : 'fail', homeOrg ? 'Present' : 'Missing',
    'Add Organization JSON-LD with name, logo, url, sameAs (LinkedIn, G2, Capterra…) on the homepage.', 2);
  add('aeo', 'site-reachable', 'Homepage reachable', home.ok ? 'pass' : 'fail', `Status ${home.status}${home.error ? ` (${home.error})` : ''}`,
    'The homepage must load for any engine to read it.', 3);

  // --- Aggregate scores: 40% site-wide checks, 60% average page score.
  const categories = ['seo', 'aeo', 'geo'];
  const scores = {};
  for (const cat of categories) {
    const siteScore = score(siteChecks.filter((c) => c.category === cat));
    const pageScores = pages.map((p) => p.scores[cat]).filter((v) => v != null);
    const pageAvg = pageScores.length ? pageScores.reduce((a, b) => a + b, 0) / pageScores.length : null;
    scores[cat] = siteScore == null ? Math.round(pageAvg ?? 0) : pageAvg == null ? siteScore : Math.round(siteScore * 0.4 + pageAvg * 0.6);
  }
  scores.overall = Math.round((scores.seo + scores.aeo + scores.geo) / 3);

  // --- Top issues: failing/warning checks ranked by weight × pages affected
  const issueMap = new Map();
  for (const c of siteChecks) if (c.status !== 'pass') issueMap.set(`site:${c.id}`, { ...c, scope: 'site', pages: [] });
  for (const p of pages) for (const c of p.checks) {
    if (c.status === 'pass') continue;
    const key = `page:${c.category}:${c.id}`;
    if (!issueMap.has(key)) issueMap.set(key, { ...c, scope: 'page', pages: [], fails: 0, warns: 0 });
    const it = issueMap.get(key);
    it.pages.push(p.url);
    if (c.status === 'fail') { it.fails++; it.status = 'fail'; } else it.warns++;
  }
  const issues = [...issueMap.values()].map((i) => ({
    ...i,
    impact: i.weight * (i.status === 'fail' ? 2 : 1) * (i.scope === 'site' ? Math.max(3, pages.length / 2) : i.pages.length),
  })).sort((a, b) => b.impact - a.impact);

  const all = [...siteChecks, ...pages.flatMap((p) => p.checks)];
  return {
    site, brand, generatedAt: new Date().toISOString(), durationMs: Date.now() - started,
    scores,
    totals: { pages: pages.length, pass: all.filter((c) => c.status === 'pass').length, warn: all.filter((c) => c.status === 'warn').length, fail: all.filter((c) => c.status === 'fail').length },
    siteChecks, issues, pages,
  };
}
