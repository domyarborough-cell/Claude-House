# Claude-House · Careficient Search Visibility Audit

A live dashboard that audits **careficient.com** around the clock for:

| | What it measures |
|---|---|
| **SEO** | Search engine optimization: status codes, speed, title/description, H1/H2 structure, canonical, noindex, sitemap, robots.txt, HTTPS redirect, soft 404s, mobile viewport, alt text, Open Graph, internal links, content depth |
| **AEO** | Answer engine optimization: question-style headings, snippet-length answers (15–70 words) under them, FAQPage/HowTo/QAPage schema, lists and tables, valid JSON-LD, breadcrumbs, lead summary |
| **GEO** | Generative engine optimization: AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…) allowed in robots.txt **and** not blocked by the CDN/WAF, `llms.txt`, content in server HTML (no JS needed), Organization/Product entity schema, authorship, freshness dates, quotable statistics, outbound citations, brand mentions |

Each check carries a weight. Pass = 1, warning = ½, fail = 0. A category score is 40% site-wide checks and 60% the average page score. The **Priority fixes** tab ranks every failing check by severity × weight × pages affected, and each one comes with a concrete fix.

## How "24/7" works

`.github/workflows/audit.yml` runs **every hour** on GitHub Actions:

1. Crawls the homepage and up to 40 URLs from the sitemap (`audit/run.mjs`)
2. Writes `docs/data/latest.json` and appends to `docs/data/history.json`, which drives the trend chart (about 83 days of hourly history)
3. Commits the data and deploys `docs/` to GitHub Pages

The dashboard refreshes itself every 5 minutes.

### One-time setup

1. Merge this branch into `main`. GitHub only runs scheduled workflows from the default branch.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. **Actions → Site audit → Run workflow** to run the first audit now.
4. Open `https://<owner>.github.io/Claude-House/`. Private repos need a GitHub plan that supports Pages.

## Run it yourself

No dependencies, just Node 18+.

```bash
npm run audit        # one audit → docs/data/*.json
npm start            # dashboard on http://localhost:8080, re-audits every hour,
                     # and enables the "Run audit now" button
npm test
```

Environment variables: `SITE_URL` (default `https://careficient.com/`), `BRAND` (default `Careficient`), `MAX_PAGES` (default 25), `PORT`, `AUDIT_INTERVAL_MIN` (server only, default 60).

`npm start` works on any always-on host (Render, Fly.io, a VM) if you want on-demand audits instead of only hourly runs.

## Layout

```
audit/html.mjs     dependency-free HTML/JSON-LD parsing helpers
audit/checks.mjs   page-level SEO/AEO/GEO checks + robots.txt parsing
audit/audit.mjs    crawler, site-wide checks, scoring, issue ranking
audit/run.mjs      CLI that saves results
server.mjs         optional live server
docs/index.html    the dashboard (GitHub Pages root)
```
