import {
  findTags, findElements, stripTags, visibleText, metaContent, jsonLd, wordCount, removeNonContent,
} from './html.mjs';

// Crawlers used by AI answer engines / LLMs. Blocking them hides the site from
// ChatGPT, Claude, Perplexity, Gemini, etc.
export const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot', 'Meta-ExternalAgent',
];

const ENTITY_TYPES = ['Organization', 'Corporation', 'MedicalOrganization', 'LocalBusiness', 'SoftwareApplication', 'WebApplication', 'Product', 'Service'];
const QA_TYPES = ['FAQPage', 'QAPage', 'HowTo'];
const QUESTION_RE = /^(what|why|how|when|where|who|which|can|does|do|is|are|should|will)\b|\?\s*$/i;

function check(category, id, label, status, detail, fix, weight = 1) {
  return { category, id, label, status, detail, fix: status === 'pass' ? null : fix, weight };
}

const pf = (ok) => (ok ? 'pass' : 'fail');

/** Page-level checks for one fetched HTML document. */
export function auditPage({ url, status, timeMs, headers, html, brand }) {
  const checks = [];
  const S = (...a) => checks.push(check('seo', ...a));
  const A = (...a) => checks.push(check('aeo', ...a));
  const G = (...a) => checks.push(check('geo', ...a));

  const metas = findTags(html, 'meta');
  const links = findTags(html, 'link');
  const anchors = findTags(html, 'a');
  const imgs = findTags(html, 'img');
  const content = removeNonContent(html);
  const headings = findElements(content, 'h[1-6]').map((h) => ({ level: Number(h.tag[1]), text: stripTags(h.inner), index: h.index, end: h.end }));
  const text = visibleText(html);
  const words = wordCount(text);
  const ld = jsonLd(html);
  const host = new URL(url).host;

  // ---------- SEO ----------
  S('http-status', 'HTTP 200 response', pf(status === 200), `Status ${status}`, 'Make sure the page returns 200 (fix broken links / redirects in the sitemap).', 3);

  S('response-time', 'Fast server response', timeMs < 800 ? 'pass' : timeMs < 2000 ? 'warn' : 'fail',
    `${timeMs} ms to full HTML`, 'Improve TTFB: enable caching/CDN, reduce server work on page render.', 2);

  const titleEl = findElements(html, 'title')[0];
  const title = titleEl ? stripTags(titleEl.inner) : '';
  S('title', 'Title tag 30–60 chars', !title ? 'fail' : title.length >= 30 && title.length <= 60 ? 'pass' : 'warn',
    title ? `"${title}" (${title.length} chars)` : 'Missing <title>', 'Write a unique, descriptive title of 30–60 characters with the primary keyword first.', 3);

  const desc = metaContent(metas, 'description');
  S('meta-description', 'Meta description 70–160 chars', !desc ? 'fail' : desc.length >= 70 && desc.length <= 160 ? 'pass' : 'warn',
    desc ? `${desc.length} chars` : 'Missing meta description', 'Add a compelling 70–160 character meta description summarizing the page.', 2);

  const h1s = headings.filter((h) => h.level === 1);
  S('h1', 'Exactly one H1', h1s.length === 1 ? 'pass' : h1s.length === 0 ? 'fail' : 'warn',
    h1s.length ? `${h1s.length} H1: "${h1s[0].text.slice(0, 80)}"` : 'No H1 found', 'Use a single H1 that states the page topic.', 2);

  const h2s = headings.filter((h) => h.level === 2);
  S('heading-structure', 'Uses H2 sub-sections', h2s.length >= 2 ? 'pass' : h2s.length === 1 ? 'warn' : 'fail',
    `${h2s.length} H2 headings`, 'Break content into H2 sections so search engines (and AI) can map topics.', 1);

  const canonical = links.find((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  let canonStatus = 'fail';
  let canonDetail = 'No canonical link';
  if (canonical?.href) {
    const abs = new URL(canonical.href, url);
    canonStatus = abs.host === host ? 'pass' : 'warn';
    canonDetail = abs.href;
  }
  S('canonical', 'Canonical URL set', canonStatus, canonDetail, 'Add <link rel="canonical"> pointing to the preferred URL to avoid duplicate content.', 2);

  const robotsMeta = (metaContent(metas, 'robots') || '') + ' ' + (headers['x-robots-tag'] || '');
  S('indexable', 'Indexable (no noindex)', pf(!/noindex/i.test(robotsMeta)), robotsMeta.trim() || 'No robots restrictions',
    'Remove noindex from pages that should rank.', 3);

  const htmlTag = findTags(html, 'html')[0] || {};
  S('lang', 'HTML lang attribute', pf(!!htmlTag.lang), htmlTag.lang ? `lang="${htmlTag.lang}"` : 'Missing', 'Add lang="en" (or the right locale) to the <html> tag.', 1);

  S('viewport', 'Mobile viewport meta', pf(!!metaContent(metas, 'viewport')), metaContent(metas, 'viewport') || 'Missing',
    'Add <meta name="viewport" content="width=device-width, initial-scale=1">.', 2);

  const missingAlt = imgs.filter((i) => i.alt === undefined).length;
  S('img-alt', 'Images have alt text', imgs.length === 0 || missingAlt === 0 ? 'pass' : missingAlt / imgs.length < 0.2 ? 'warn' : 'fail',
    `${imgs.length - missingAlt}/${imgs.length} images with alt`, 'Add descriptive alt text to every meaningful image.', 1);

  const og = ['og:title', 'og:description', 'og:image'].filter((k) => !metaContent(metas, k));
  S('open-graph', 'Open Graph tags', og.length === 0 ? 'pass' : og.length < 3 ? 'warn' : 'fail',
    og.length ? `Missing ${og.join(', ')}` : 'og:title, og:description, og:image present', 'Add Open Graph tags so shares (and some AI previews) render rich cards.', 1);

  const internal = anchors.filter((a) => {
    try { return a.href && new URL(a.href, url).host === host; } catch { return false; }
  }).length;
  S('internal-links', 'Internal links', internal >= 5 ? 'pass' : internal >= 2 ? 'warn' : 'fail', `${internal} internal links`,
    'Link to related pages to distribute authority and help crawlers discover content.', 1);

  S('content-length', 'Substantive content (300+ words)', words >= 300 ? 'pass' : words >= 150 ? 'warn' : 'fail', `${words} words`,
    'Expand thin pages with useful, specific content.', 2);

  S('https', 'Served over HTTPS', pf(url.startsWith('https://')), url.split(':')[0], 'Serve every page over HTTPS.', 2);

  // ---------- AEO (answer engine optimization) ----------
  const questionHeads = headings.filter((h) => h.level >= 2 && QUESTION_RE.test(h.text));
  A('question-headings', 'Question-style headings', questionHeads.length >= 2 ? 'pass' : questionHeads.length === 1 ? 'warn' : 'fail',
    `${questionHeads.length} question headings${questionHeads[0] ? ` e.g. "${questionHeads[0].text.slice(0, 70)}"` : ''}`,
    'Phrase some H2/H3s as the questions buyers ask ("What is home health software?").', 3);

  // Is the first paragraph after each question heading a concise, extractable answer?
  let concise = 0;
  for (const q of questionHeads) {
    const p = findElements(content.slice(q.end, q.end + 4000), 'p')[0];
    const wc = p ? wordCount(stripTags(p.inner)) : 0;
    if (wc >= 15 && wc <= 70) concise++;
  }
  A('concise-answers', 'Concise answers under questions (15–70 words)',
    questionHeads.length === 0 ? 'fail' : concise / questionHeads.length >= 0.6 ? 'pass' : concise > 0 ? 'warn' : 'fail',
    `${concise}/${questionHeads.length} questions followed by a snippet-length answer`,
    'Answer each question directly in the first 40–60 words below the heading, then elaborate.', 3);

  const qaTypes = QA_TYPES.filter((t) => ld.types.has(t));
  A('qa-schema', 'FAQ / HowTo / QA schema', qaTypes.length ? 'pass' : questionHeads.length ? 'fail' : 'warn',
    qaTypes.length ? qaTypes.join(', ') : 'None', 'Mark up FAQ content with FAQPage (or HowTo/QAPage) JSON-LD.', 2);

  const lists = findElements(content, 'ul|ol').length;
  const tables = findElements(content, 'table').length;
  A('scannable', 'Lists or tables for extraction', lists + tables >= 2 ? 'pass' : lists + tables === 1 ? 'warn' : 'fail',
    `${lists} lists, ${tables} tables`, 'Use bulleted steps, comparisons and tables — answer engines lift these verbatim.', 1);

  A('structured-data', 'Valid JSON-LD present', ld.errors.length ? 'fail' : ld.nodes.length ? 'pass' : 'fail',
    ld.errors.length ? `JSON-LD parse error: ${ld.errors[0]}` : ld.types.size ? [...ld.types].join(', ') : 'No JSON-LD',
    'Add schema.org JSON-LD (Organization, WebPage, BreadcrumbList, FAQPage...).', 2);

  A('breadcrumbs', 'BreadcrumbList schema', ld.types.has('BreadcrumbList') ? 'pass' : 'warn',
    ld.types.has('BreadcrumbList') ? 'Present' : 'Missing', 'Add BreadcrumbList schema to clarify site hierarchy.', 1);

  const firstP = findElements(content, 'p').map((p) => stripTags(p.inner)).find((t) => wordCount(t) >= 8) || '';
  const fpw = wordCount(firstP);
  A('lead-summary', 'Clear lead summary paragraph', fpw >= 15 && fpw <= 80 ? 'pass' : fpw ? 'warn' : 'fail',
    fpw ? `First paragraph ${fpw} words` : 'No paragraph text in HTML', 'Open with a 1–3 sentence summary of what the page offers and for whom.', 1);

  // ---------- GEO (generative engine optimization) ----------
  const ratio = html.length ? text.length / html.length : 0;
  G('server-rendered', 'Content in raw HTML (no JS needed)', words >= 200 ? 'pass' : words >= 80 ? 'warn' : 'fail',
    `${words} words in server HTML · text/HTML ratio ${(ratio * 100).toFixed(1)}%`,
    'Most AI crawlers do not run JavaScript — server-render or pre-render the main content.', 3);

  const entities = ENTITY_TYPES.filter((t) => ld.types.has(t));
  G('entity-schema', 'Entity schema (Organization/Product)', entities.length ? 'pass' : 'fail', entities.length ? entities.join(', ') : 'None',
    'Describe Careficient as an Organization / SoftwareApplication in JSON-LD so LLMs resolve the entity.', 2);

  const hasAuthor = ld.nodes.some((n) => n.author || n.publisher) || !!metaContent(metas, 'author');
  G('authorship', 'Author / publisher signals', hasAuthor ? 'pass' : 'warn', hasAuthor ? 'Present' : 'No author or publisher markup',
    'Attribute content to a named author or the organization (E-E-A-T trust signals).', 1);

  const modified = ld.nodes.map((n) => n.dateModified || n.datePublished).find(Boolean)
    || metaContent(metas, 'article:modified_time') || metaContent(metas, 'article:published_time') || headers['last-modified'];
  let freshStatus = 'warn';
  let freshDetail = 'No published/modified date';
  if (modified) {
    const ageDays = (Date.now() - new Date(modified).getTime()) / 864e5;
    freshStatus = Number.isNaN(ageDays) ? 'warn' : ageDays <= 365 ? 'pass' : 'warn';
    freshDetail = Number.isNaN(ageDays) ? `Unparseable date "${modified}"` : `Updated ${Math.round(ageDays)} days ago`;
  }
  G('freshness', 'Freshness date signal', freshStatus, freshDetail, 'Expose dateModified in schema and keep key pages updated within 12 months.', 1);

  const stats = (text.match(/\b\d[\d,.]*\s?(%|percent|x\b|million|billion|hours|days|patients|agencies)/gi) || []).length;
  G('statistics', 'Specific facts & statistics', stats >= 3 ? 'pass' : stats >= 1 ? 'warn' : 'fail', `${stats} quantified claims`,
    'Generative engines favour concrete, quotable numbers — add stats, outcomes and data points.', 2);

  const external = anchors.filter((a) => {
    try { const u = new URL(a.href, url); return /^https?:$/.test(u.protocol) && u.host !== host; } catch { return false; }
  }).length;
  G('citations', 'Cites external sources', external >= 2 ? 'pass' : external === 1 ? 'warn' : 'fail', `${external} outbound links`,
    'Cite authoritative sources (CMS, regulations, studies) — cited content is cited back.', 1);

  if (brand) {
    const mentions = (text.match(new RegExp(`\\b${brand}\\b`, 'gi')) || []).length;
    G('brand-mentions', 'Brand entity named in copy', mentions >= 2 ? 'pass' : mentions === 1 ? 'warn' : 'fail', `"${brand}" mentioned ${mentions}×`,
      'Name the brand explicitly in body copy (not only in logos) so LLMs associate claims with it.', 1);
  }

  return { checks, title, words, schemaTypes: [...ld.types] };
}

/** Parse robots.txt into groups of {agents, rules}. */
export function parseRobots(txt) {
  const groups = [];
  const sitemaps = [];
  let cur = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'sitemap') { sitemaps.push(val); continue; }
    if (key === 'user-agent') {
      if (!lastWasAgent || !cur) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ type: key, path: val });
    }
  }
  return { groups, sitemaps };
}

/** True if the given bot is fully blocked from "/" by robots.txt. */
export function botBlocked(robots, bot) {
  const b = bot.toLowerCase();
  const group = robots.groups.find((g) => g.agents.includes(b)) || robots.groups.find((g) => g.agents.includes('*'));
  if (!group) return false;
  const rootDisallow = group.rules.some((r) => r.type === 'disallow' && r.path === '/');
  const rootAllow = group.rules.some((r) => r.type === 'allow' && (r.path === '/' || r.path === '/*'));
  return rootDisallow && !rootAllow;
}

export { check };
