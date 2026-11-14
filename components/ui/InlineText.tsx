import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { parseInline, hasInlineMarkdown } from '@/lib/inline-markdown';

type Token = ReturnType<typeof parseInline>[number];

interface Props {
  text: string;
  /**
   * Turns a link target from the copy into a site path, or null to show only its text.
   * Pass `resolveInternalLink` (lib/internal-links) from a server component; without it, links
   * render as plain text. Left out on purpose in client components (it reads the content files).
   */
  resolveLink?: (href: string) => string | null;
}

function renderTokens(tokens: Token[], resolveLink: Props['resolveLink'], keyPrefix: string): ReactNode {
  return tokens.map((token, i) => {
    const key = `${keyPrefix}${i}`;
    if (token.type === 'text') return <Fragment key={key}>{token.value}</Fragment>;
    const children = renderTokens(token.children, resolveLink, `${key}.`);
    if (token.type === 'bold') return <strong key={key}>{children}</strong>;
    if (token.type === 'italic') return <em key={key}>{children}</em>;
    const href = resolveLink ? resolveLink(token.href) : null;
    // External or broken target: just the text, never a dead or off-site link.
    if (!href) return <Fragment key={key}>{children}</Fragment>;
    return (
      <Link key={key} href={href} prefetch={false} className="text-[#1761a0] hover:underline">
        {children}
      </Link>
    );
  });
}

/** A plain-text copy field with its inline Markdown (links, bold, italic) turned into real elements. */
export default function InlineText({ text, resolveLink }: Props) {
  const tokens = parseInline(text);
  // No markup: hand back the bare string so the page output is exactly what `{text}` produced before.
  if (tokens.length === 0) return text;
  if (tokens.length === 1 && tokens[0].type === 'text') return tokens[0].value;
  return <>{renderTokens(tokens, resolveLink, '')}</>;
}

/**
 * Call-site helper: the field as it is when it has no markup (so a page without Markdown renders
 * exactly as it did before), `<InlineText>` when it has.
 */
export function inlineText(text: string, resolveLink?: Props['resolveLink']): ReactNode {
  return hasInlineMarkdown(text) ? <InlineText text={text} resolveLink={resolveLink} /> : text;
}
