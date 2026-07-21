'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Code-split: SearchModal + Fuse.js load only when modal first opens
const SearchModal = dynamic(() => import('@/components/search/SearchModal'), { ssr: false });

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="bg-white border-b border-stone-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" prefetch={false} className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Castles & Palaces"
              width={140}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/castles" prefetch={false} className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Castles
            </Link>
            <Link href="/tours" prefetch={false} className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Tours
            </Link>
            <Link href="/map" prefetch={false} className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Map
            </Link>
            <Link href="/quiz" prefetch={false} className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              Quiz
            </Link>
            <Link href="/about" prefetch={false} className="text-[#1761a0]/80 hover:text-[#1761a0] transition-colors">
              About
            </Link>

            {/* Search button with Cmd+K hint */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search castles (⌘K)"
              className="flex items-center gap-2 text-[#1761a0]/70 hover:text-[#1761a0] transition-colors"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              {/* Keyboard shortcut badge — only on large screens */}
              <span className="hidden lg:flex items-center gap-0.5 text-[10px] text-stone-400">
                <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono leading-none">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono leading-none">K</kbd>
              </span>
            </button>
          </nav>

          {/* ── Mobile: search + hamburger ── */}
          <div className="md:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search castles"
              className="flex items-center justify-center w-11 h-11 text-[#1761a0]/70 hover:text-[#1761a0] transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            <button
              type="button"
              className="flex items-center justify-center w-11 h-11 text-[#1761a0]/70 hover:text-[#1761a0] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-100 py-4 flex flex-col gap-4 text-sm font-medium">
            <Link href="/castles" prefetch={false} onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Castles</Link>
            <Link href="/tours" prefetch={false} onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Tours</Link>
            <Link href="/map" prefetch={false} onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Map</Link>
            <Link href="/quiz" prefetch={false} onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">Quiz</Link>
            <Link href="/about" prefetch={false} onClick={() => setMenuOpen(false)} className="text-[#1761a0]/80 hover:text-[#1761a0]">About</Link>
          </div>
        )}
      </div>

      {/* Search modal — lazy-loaded chunk, only mounts when opened */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
