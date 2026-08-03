import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1761a0] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link href="/" prefetch={false} className="inline-block mb-4">
              <span className="font-serif text-xl font-bold text-white tracking-tight">
                Castles <span className="text-[#c9a84c]">&amp;</span> Palaces
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              The editorial guide to Europe's most beautiful historic castles and palaces.
            </p>
            <p className="mt-4 text-xs text-white/40">
              Follow us{' '}
              <a
                href="https://instagram.com/castlespalaces"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c9a84c] hover:underline"
              >
                @castlespalaces
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/castles" prefetch={false} className="hover:text-[#c9a84c] transition-colors">All Castles</Link></li>
              <li><Link href="/tours" prefetch={false} className="hover:text-[#c9a84c] transition-colors">Castle Tours</Link></li>
              <li><Link href="/map" prefetch={false} className="hover:text-[#c9a84c] transition-colors">Castle Map</Link></li>
              <li><Link href="/quiz" prefetch={false} className="hover:text-[#c9a84c] transition-colors">Castle Quiz</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Site</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" prefetch={false} className="hover:text-[#c9a84c] transition-colors">About</Link></li>
              <li><Link href="/contact" prefetch={false} className="hover:text-[#c9a84c] transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Castles & Palaces. All rights reserved.</p>
          <p>
            Tours powered by{' '}
            <a href="https://www.getyourguide.com" target="_blank" rel="noopener noreferrer sponsored" className="hover:text-[#c9a84c]">
              GetYourGuide
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
