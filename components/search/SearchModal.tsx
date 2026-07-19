'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { useRouter } from 'next/navigation';

interface SearchEntry {
  id: string;
  country: string;
  name: string;
  region: string | null;
  thumb: string | null;
  price: number | null;
  currency: string | null;
  featured: boolean;
  unesco: boolean;
}

interface NormalizedEntry extends SearchEntry {
  _name: string;
  _country: string;
  _region: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ');
}

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', GBP: '£', USD: '$' };

function formatPrice(price: number | null, currency: string | null): string | null {
  if (price === null) return null;
  if (price === 0) return 'Free';
  const symbol = CURRENCY_SYMBOLS[currency ?? ''] ?? (currency ?? '');
  return `From ${symbol}${price}`;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [featured, setFeatured] = useState<SearchEntry[]>([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [loaded, setLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef<Fuse<NormalizedEntry> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Load search index on first open
  useEffect(() => {
    if (!isOpen || fuseRef.current) return;
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        const normalized: NormalizedEntry[] = data.map((e) => ({
          ...e,
          _name: normalize(e.name),
          _country: normalize(e.country),
          _region: normalize(e.region ?? ''),
        }));
        fuseRef.current = new Fuse(normalized, {
          keys: [
            { name: '_name', weight: 3 },
            { name: '_country', weight: 1 },
            { name: '_region', weight: 1 },
          ],
          threshold: 0.35,
          minMatchCharLength: 2,
        });
        setFeatured(data.filter((e) => e.featured).slice(0, 6));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [isOpen]);

  // Autofocus input on open (slight delay for the dynamic import to settle)
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Body scroll lock — preserve scroll position to avoid layout shift
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setHighlighted(-1);
    }
  }, [isOpen]);

  const performSearch = useCallback((q: string) => {
    if (!fuseRef.current || !q.trim()) {
      setResults([]);
      setHighlighted(-1);
      return;
    }
    const hits = fuseRef.current
      .search(normalize(q))
      .slice(0, 8)
      .map((r) => r.item);
    setResults(hits);
    setHighlighted(-1);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(val), 150);
  };

  const displayItems = query.trim() ? results : featured;
  const showNoResults = query.trim().length >= 2 && loaded && results.length === 0;

  const navigate = useCallback(
    (item: SearchEntry) => {
      router.push(`/castles/${item.country}/${item.id}`);
      onClose();
    },
    [router, onClose]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const el = listRef.current.children[highlighted] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, displayItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted((h) => {
          if (h <= 0) {
            inputRef.current?.focus();
            return -1;
          }
          return h - 1;
        });
        break;
      case 'Enter':
        if (highlighted >= 0 && displayItems[highlighted]) {
          navigate(displayItems[highlighted]);
        }
        break;
      case 'Escape':
        onClose();
        break;
      case 'Tab': {
        // Basic focus trap
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) break;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
        break;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col md:items-center md:justify-start md:pt-[5vh] bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search castles"
        onKeyDown={handleKeyDown}
        className="bg-white w-full h-[100dvh] md:h-auto md:max-w-xl md:rounded-xl md:shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(100dvh, 640px)' }}
      >
        {/* ── Input bar ── */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-stone-100 flex-shrink-0">
          {/* Magnifying glass */}
          <svg
            className="w-5 h-5 text-stone-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            placeholder="Search castles…"
            value={query}
            onChange={handleInputChange}
            className="flex-1 text-base bg-transparent outline-none text-[#1a1a1a] placeholder:text-stone-400 min-w-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          {/* Clear input button — visible when there's text */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setHighlighted(-1);
                inputRef.current?.focus();
              }}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 transition-colors flex-shrink-0"
              aria-label="Clear search"
              tabIndex={0}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Close button — always visible (required on mobile full-screen) */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors flex-shrink-0"
            aria-label="Close search"
            style={{ marginRight: 'calc(env(safe-area-inset-right, 0px) - 4px)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Results pane ── */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Section label for featured castles when no query */}
          {!query.trim() && featured.length > 0 && loaded && (
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
              Featured castles
            </p>
          )}

          {/* Loading skeleton */}
          {!loaded && (
            <div className="px-4 py-6 text-center text-sm text-stone-400">Loading…</div>
          )}

          {/* No-results state */}
          {showNoResults && (
            <div className="px-4 py-10 text-center">
              <p className="text-stone-500 text-sm">
                No castles found for &ldquo;<span className="font-medium text-[#1a1a1a]">{query}</span>&rdquo;
              </p>
              <Link
                href="/castles"
                onClick={onClose}
                className="mt-3 inline-block text-sm text-[#1761a0] hover:underline"
              >
                Browse all castles →
              </Link>
            </div>
          )}

          {/* Result / featured list */}
          {!showNoResults && loaded && (
            <div ref={listRef} role="listbox" aria-label="Search results">
              {displayItems.map((item, i) => {
                const price = formatPrice(item.price, item.currency);
                return (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={highlighted === i}
                    onClick={() => navigate(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[52px] ${
                      highlighted === i
                        ? 'bg-stone-50'
                        : 'hover:bg-stone-50/80 active:bg-stone-100'
                    }`}
                  >
                    {/* Thumbnail */}
                    {item.thumb ? (
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100">
                        <Image
                          src={item.thumb}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-stone-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 21V10m14 11V10M9 21V10m6 11V10M3 10l9-7 9 7" />
                        </svg>
                      </div>
                    )}

                    {/* Name + country */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a1a1a] text-sm leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-stone-400 capitalize mt-0.5 truncate">
                        {item.country.replace(/-/g, ' ')}
                        {item.region ? ` · ${item.region}` : ''}
                      </p>
                    </div>

                    {/* Price */}
                    {price && (
                      <p className={`text-xs flex-shrink-0 font-medium ${price === 'Free' ? 'text-green-700' : 'text-stone-500'}`}>
                        {price}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state — index loaded but no query and no featured */}
          {loaded && !query.trim() && featured.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-stone-400">
              Start typing to search castles…
            </div>
          )}
        </div>

        {/* ── Footer hint (desktop only) ── */}
        <div className="hidden md:flex items-center gap-4 px-4 py-2.5 border-t border-stone-100 text-[10px] text-stone-400 flex-shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px]">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px]">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[10px]">Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
