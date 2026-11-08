'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// TEMPORARY exception: /castles/malta is under a Search Console measurement until 17 Nov 2026 and its
// HTML must not change, so the new footer link is left out of that one page. Delete the pathname
// check (and make this a plain <li><Link/></li> in Footer.tsx) after 17 Nov 2026.
export default function GuidesFooterLink() {
  const pathname = usePathname();
  if (pathname === '/castles/malta') return null;
  return (
    <li>
      <Link href="/guides" prefetch={false} className="hover:text-[#c9a84c] transition-colors">
        Castle Guides
      </Link>
    </li>
  );
}
