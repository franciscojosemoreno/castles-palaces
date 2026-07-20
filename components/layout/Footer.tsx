import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1761a0] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
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
              <li><Link href="/castles" className="hover:text-[#c9a84c] transition-colors">All Castles</Link></li>
              <li><Link href="/tours" className="hover:text-[#c9a84c] transition-colors">Castle Tours</Link></li>
              <li><Link href="/map" className="hover:text-[#c9a84c] transition-colors">Castle Map</Link></li>
              <li><Link href="/quiz" className="hover:text-[#c9a84c] transition-colors">Castle Quiz</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">By Country</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/castles/england" className="hover:text-[#c9a84c] transition-colors">England</Link></li>
              <li><Link href="/castles/france" className="hover:text-[#c9a84c] transition-colors">France</Link></li>
              <li><Link href="/castles/germany" className="hover:text-[#c9a84c] transition-colors">Germany</Link></li>
              <li><Link href="/castles/scotland" className="hover:text-[#c9a84c] transition-colors">Scotland</Link></li>
              <li><Link href="/castles/spain" className="hover:text-[#c9a84c] transition-colors">Spain</Link></li>
              <li><Link href="/castles/italy" className="hover:text-[#c9a84c] transition-colors">Italy</Link></li>
              <li><Link href="/castles/portugal" className="hover:text-[#c9a84c] transition-colors">Portugal</Link></li>
              <li><Link href="/castles/austria" className="hover:text-[#c9a84c] transition-colors">Austria</Link></li>
              <li><Link href="/castles/czech-republic" className="hover:text-[#c9a84c] transition-colors">Czech Republic</Link></li>
              <li><Link href="/castles/romania" className="hover:text-[#c9a84c] transition-colors">Romania</Link></li>
              <li><Link href="/castles/san-marino" className="hover:text-[#c9a84c] transition-colors">San Marino</Link></li>
              <li><Link href="/castles/monaco" className="hover:text-[#c9a84c] transition-colors">Monaco</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Site</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-[#c9a84c] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#c9a84c] transition-colors">Contact</Link></li>
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
