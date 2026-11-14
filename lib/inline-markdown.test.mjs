#!/usr/bin/env node
// Fixture tests for lib/inline-markdown.js and lib/internal-links.js. Run: node lib/inline-markdown.test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseInline, stripMarkdown, internalTarget } = require('./inline-markdown.js');
const { resolveInternalLink } = require('./internal-links.js');

let failures = 0;
const eq = (label, actual, expected) => {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL: ${label}\n  expected ${e}\n  got      ${a}`); failures++; } else console.log(`ok: ${label}`);
};

eq('plain text is one token', parseInline('no markup here'), [{ type: 'text', value: 'no markup here' }]);
eq('link', parseInline('see [Poppiano](/castles/italy/castle-of-poppiano) now'), [
  { type: 'text', value: 'see ' },
  { type: 'link', href: '/castles/italy/castle-of-poppiano', children: [{ type: 'text', value: 'Poppiano' }] },
  { type: 'text', value: ' now' },
]);
eq('bold', parseInline('a **b** c').map((t) => t.type), ['text', 'bold', 'text']);
eq('italic', parseInline('the *kasır* is').map((t) => t.type), ['text', 'italic', 'text']);
eq('bold link nests', parseInline('**[x](/a)**')[0].children[0].type, 'link');
eq('a footnote star is not italic', parseInline('Entry* then 5 * 3').map((t) => t.type), ['text']);
eq('a double star is not italic', parseInline('**solo**').map((t) => t.type), ['bold']);
eq('link text with & and :', parseInline('[Oban: A, B & C](/tours/x/y)')[0].children[0].value, 'Oban: A, B & C');

eq('strip: link, bold, italic', stripMarkdown('A [b](/x) **c** *d*'), 'A b c d');
eq('strip: list dashes become plain lines', stripMarkdown('Intro\n- **Low tide:** open\n- High tide'), 'Intro\nLow tide: open\nHigh tide');
eq('strip: leaves ordinary hyphens alone', stripMarkdown('Open 9-5 — daily'), 'Open 9-5 — daily');

eq('target: relative', internalTarget('/castles/a/b'), { path: '/castles/a/b', hash: '' });
eq('target: absolute site url', internalTarget('https://www.castles-palaces.com/castles/a/b/?x=1#h'), { path: '/castles/a/b', hash: '#h' });
eq('target: external', internalTarget('https://example.com/castles/a/b'), null);
eq('target: lookalike host', internalTarget('https://castles-palaces.com.evil.io/x'), null);
eq('target: mailto', internalTarget('mailto:a@b.c'), null);
eq('target: protocol-relative', internalTarget('//evil.io/x'), null);

eq('resolve: published castle', resolveInternalLink('/castles/italy/castle-of-poppiano'), '/castles/italy/castle-of-poppiano');
eq('resolve: absolute url of a castle', resolveInternalLink('https://www.castles-palaces.com/castles/italy/castle-of-poppiano'), '/castles/italy/castle-of-poppiano');
eq('resolve: tour', resolveInternalLink('/tours/scotland/oban-dunstaffnage-kilchurn-coffin-trail'), '/tours/scotland/oban-dunstaffnage-kilchurn-coffin-trail');
eq('resolve: country hub', resolveInternalLink('/castles/italy'), '/castles/italy');
eq('resolve: missing castle', resolveInternalLink('/castles/italy/no-such-castle'), null);
eq('resolve: wrong country for a castle', resolveInternalLink('/castles/spain/castle-of-poppiano'), null);
eq('resolve: external', resolveInternalLink('https://example.com'), null);

if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log('all ok');
