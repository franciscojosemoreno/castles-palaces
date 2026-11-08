import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Every castle / castle-hotel URL on this site is lowercase. An external link (or an old cached
// one) with capitals, e.g. /castles/Bulgaria/kaliakra-fortress, would otherwise be a 404 on
// Linux hosts. Redirect it permanently to the lowercase URL, keeping the query string.
//
// The matcher regex is case-sensitive and only matches paths that contain a capital letter, so
// this proxy never runs for the normal, already-lowercase requests.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Lowercase letters only: leave percent-escapes such as %C3%A9 untouched.
  const lowered = pathname.replace(/%[0-9A-Fa-f]{2}|[A-Z]/g, (m) => (m.startsWith('%') ? m : m.toLowerCase()));
  if (lowered === pathname) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = lowered;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ['/castles/:path([^?]*[A-Z][^?]*)', '/castle-hotels/:path([^?]*[A-Z][^?]*)'],
};
