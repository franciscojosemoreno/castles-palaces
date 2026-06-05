'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Castles & Palaces"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/castles" className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Castles
            </Link>
            <Link href="/tours" className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Tours
            </Link>
            <Link href="/map" className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Map
            </Link>
            <Link href="/quiz" className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Quiz
            </Link>
            <Link href="/about" className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              About
            </Link>
          </nav>

          <button
            className="md:hidden text-[#1761a0]/70 hover:text-[#1761a0]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-stone-100 py-4 flex flex-col gap-4 text-sm font-medium">
            <Link href="/castles" onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Castles</Link>
            <Link href="/tours" onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Tours</Link>
            <Link href="/map" onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Map</Link>
            <Link href="/quiz" onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Quiz</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">About</Link>
          </div>
        )}
      </div>
    </header>
  );
}
