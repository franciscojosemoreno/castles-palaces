// The inline Markdown subset allowed in plain-text copy fields (castle description, history, highlights,
// tagline, itinerary stops, ...): [text](url) links, **bold** and *italic*. One definition, used by:
//   - components/ui/InlineText.tsx   (turns a field into React nodes on the page)
//   - lib/internal-links.js          (decides which link targets are real pages)
//   - scripts/check-markdown.mjs     (prebuild: fails on anything the renderer cannot resolve)
//   - structured data (JSON-LD)      (stripMarkdown: the same text without any markup)
//
// Plain CommonJS so the Next build and the Node prebuild scripts can both load it.

// Alternatives, in priority order: link, bold, italic. Italic is strict: the asterisks hug the text and
// are not part of a word or of `**`, so a stray "*" or a footnote star is never taken for emphasis.
const INLINE_RE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])/g;

/**
 * Splits text into tokens: { type: 'text', value } | { type: 'link', href, children } |
 * { type: 'bold' | 'italic', children }. `children` is a token list (emphasis can nest).
 */
function parseInline(text) {
  const tokens = [];
  let last = 0;
  // A fresh regex per call: the recursion below must not share lastIndex with this loop.
  const re = new RegExp(INLINE_RE.source, 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: 'link', href: m[2], children: parseInline(m[1]) });
    else if (m[3] !== undefined) tokens.push({ type: 'bold', children: parseInline(m[3]) });
    else tokens.push({ type: 'italic', children: parseInline(m[4]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

function tokensToText(tokens) {
  return tokens.map((t) => (t.type === 'text' ? t.value : tokensToText(t.children))).join('');
}

/** Whether the text uses any link, bold or italic (false: it can be printed as it is). */
function hasInlineMarkdown(text) {
  return parseInline(text).some((t) => t.type !== 'text');
}

/** The text without any inline Markdown, and list markers ("- ") turned into plain line starts. For JSON-LD. */
function stripMarkdown(text) {
  if (typeof text !== 'string') return text;
  return tokensToText(parseInline(text.replace(/^(\s*)[-*] (?=\S)/gm, '$1')))
    .replace(/^#{1,6} +/gm, '');
}

const SITE_HOST = /^https?:\/\/(?:www\.)?castles-palaces\.com(?=\/|$)/i;

/**
 * An internal link target as { path, hash }, or null when the href is external (any other host,
 * mailto:, tel:, protocol-relative) or not a path at all. Accepts a relative path or a
 * castles-palaces.com URL; the query string is dropped, the path loses a trailing slash.
 */
function internalTarget(href) {
  let rest = href.trim().replace(SITE_HOST, '');
  if (!rest.startsWith('/') || rest.startsWith('//')) return null;
  let hash = '';
  const h = rest.indexOf('#');
  if (h >= 0) { hash = rest.slice(h); rest = rest.slice(0, h); }
  const q = rest.indexOf('?');
  if (q >= 0) rest = rest.slice(0, q);
  if (rest.length > 1) rest = rest.replace(/\/+$/, '');
  return { path: rest || '/', hash };
}

module.exports = { INLINE_RE, parseInline, hasInlineMarkdown, tokensToText, stripMarkdown, internalTarget };
