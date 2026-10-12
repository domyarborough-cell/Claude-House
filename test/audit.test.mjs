import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { runAudit } from '../audit/audit.mjs';
import { parseRobots, botBlocked } from '../audit/checks.mjs';

const GOOD = `<!doctype html><html lang="en"><head><title>Home Health Software for Agencies | Careficient</title>
<meta name="description" content="Careficient is home health and hospice software that helps agencies document, bill and stay compliant with less effort.">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="/">
<meta property="og:title" content="x"><meta property="og:description" content="x"><meta property="og:image" content="x">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Careficient","dateModified":"${new Date().toISOString()}","publisher":"Careficient"},{"@type":"FAQPage"},{"@type":"BreadcrumbList"}]}</script>
</head><body><h1>Home health software</h1>
<p>Careficient helps home health and hospice agencies run documentation, billing and compliance in one platform built for clinicians.</p>
<h2>What is home health software?</h2><p>Home health software is an EHR that lets agencies schedule visits, chart OASIS assessments, and bill Medicare from one place, cutting admin time.</p>
<h2>How does Careficient reduce denials?</h2><p>Careficient scrubs claims before submission and flags missing documentation so agencies see 30% fewer denials and get paid in 14 days on average.</p>
<ul><li>a</li></ul><table><tr><td>b</td></tr></table>
${'<p>Careficient serves 500 agencies with reliable, specific, useful content for clinicians and administrators. </p>'.repeat(30)}
<a href="/a">a</a><a href="/b">b</a><a href="/c">c</a><a href="/d">d</a><a href="/e">e</a>
<a href="https://www.cms.gov/">CMS</a><a href="https://oig.hhs.gov/">OIG</a><img src="x.png" alt="logo"></body></html>`;

function serve(routes) {
  return new Promise((res) => {
    const s = createServer((req, r) => {
      const h = routes[req.url];
      if (!h) { r.writeHead(404); return r.end('nope'); }
      r.writeHead(h.status || 200, { 'content-type': h.type || 'text/html', ...(h.headers || {}) });
      r.end(h.body || '');
    }).listen(0, () => res(s));
  });
}

test('robots parsing detects blocked AI bots', () => {
  const r = parseRobots('User-agent: GPTBot\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nSitemap: https://x/s.xml');
  assert.equal(botBlocked(r, 'GPTBot'), true);
  assert.equal(botBlocked(r, 'CCBot'), true);
  assert.equal(botBlocked(r, 'ClaudeBot'), false);
  assert.deepEqual(r.sitemaps, ['https://x/s.xml']);
});

test('well-optimized site scores high, poor site scores low', async () => {
  let base;
  const good = await serve({
    '/': { body: GOOD },
    '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nAllow: /' },
    '/sitemap.xml': { type: 'application/xml', get body() { return `<urlset><url><loc>${base}/</loc></url><url><loc>${base}/a</loc></url></urlset>`; } },
    '/a': { body: GOOD },
    '/llms.txt': { type: 'text/plain', body: '# Careficient\n> Home health and hospice software.\n- [Home](/): overview of the platform' },
  });
  base = `http://localhost:${good.address().port}`;
  const r = await runAudit({ site: base + '/' });
  good.close();
  assert.equal(r.pages.length, 2);
  assert.ok(r.scores.aeo >= 80, `aeo ${r.scores.aeo}`);
  assert.ok(r.scores.geo >= 70, `geo ${r.scores.geo}`);

  const bad = await serve({
    '/': { body: '<html><body><div id="root"></div><script src="app.js"></script></body></html>' },
    '/robots.txt': { type: 'text/plain', body: 'User-agent: GPTBot\nDisallow: /\nUser-agent: ClaudeBot\nDisallow: /\nUser-agent: PerplexityBot\nDisallow: /' },
  });
  const r2 = await runAudit({ site: `http://localhost:${bad.address().port}/` });
  bad.close();
  assert.ok(r2.scores.overall < 40, `overall ${r2.scores.overall}`);
  assert.equal(r2.siteChecks.find((c) => c.id === 'ai-crawlers-robots').status, 'fail');
  assert.ok(r2.issues.length > 5);
});

test('unreachable site still produces a report', async () => {
  const r = await runAudit({ site: 'http://127.0.0.1:9/' });
  assert.equal(r.siteChecks.find((c) => c.id === 'site-reachable').status, 'fail');
  assert.ok(r.scores.overall < 30);
});
