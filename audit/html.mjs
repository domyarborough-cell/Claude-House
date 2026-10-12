// Minimal, dependency-free HTML helpers. These are regex based on purpose:
// the auditor only needs signals (tags, attributes, text), not a full DOM.

export function decodeEntities(s = '') {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

export function stripTags(s = '') {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function parseAttrs(tagSource) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  // Skip the tag name itself.
  const body = tagSource.replace(/^<\s*[a-zA-Z0-9-]+/, '').replace(/\/?>$/, '');
  let m;
  while ((m = re.exec(body))) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

/** All opening tags of a given name, as attribute objects. */
export function findTags(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  return (html.match(re) || []).map(parseAttrs);
}

/** Elements with inner content, e.g. headings, paragraphs. */
export function findElements(html, tag) {
  const re = new RegExp(`<(${tag})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    out.push({ tag: m[1].toLowerCase(), attrs: parseAttrs(`<x ${m[2]}>`), inner: m[3], index: m.index, end: re.lastIndex });
  }
  return out;
}

export function removeNonContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, ' ');
}

export function visibleText(html) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  return stripTags(removeNonContent(bodyMatch ? bodyMatch[1] : html));
}

export function metaContent(metas, key) {
  key = key.toLowerCase();
  const m = metas.find((t) => (t.name || t.property || '').toLowerCase() === key);
  return m ? (m.content ?? '').trim() : null;
}

export function jsonLd(html) {
  const blocks = [];
  const errors = [];
  const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch (e) {
      errors.push(e.message);
    }
  }
  const nodes = [];
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      if (v['@type']) nodes.push(v);
      Object.values(v).forEach(walk);
    }
  };
  walk(blocks);
  const types = new Set();
  for (const n of nodes) [].concat(n['@type']).forEach((t) => types.add(String(t)));
  return { blocks, nodes, types, errors };
}

export function wordCount(text) {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
}

/** Hosts match ignoring a leading "www." (careficient.com == www.careficient.com). */
export function sameSite(a, b) {
  const h = (x) => x.replace(/^www\./i, '').toLowerCase();
  return h(a) === h(b);
}
