import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllGuides, getGuideBySlug } from '@/lib/guides';
import { getCastlesByIds } from '@/lib/castles';
import CastleCard from '@/components/castle/CastleCard';
import GYGWidget from '@/components/affiliate/GYGWidget';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface PageProps {
  params: Promise<{ guide: string }>;
}

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ guide: g.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guide: guideSlug } = await params;
  const guide = getGuideBySlug(guideSlug);
  if (!guide) return {};

  const title = guide.meta_title ?? guide.title;
  const description = guide.meta_description ?? '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: guide.hero_image.url, width: 1200, height: 630 }],
      type: 'article',
    },
    alternates: { canonical: `/guides/${guideSlug}` },
  };
}

// Minimal markdown renderer — bold, headings, lists, paragraphs
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return null;
    const el = (
      <ul key={key} className="space-y-2 mb-6 pl-1">
        {listBuffer.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-stone-700 text-base leading-relaxed">
            <span className="text-[#c9a84c] font-bold mt-1 flex-shrink-0">✦</span>
            <span dangerouslySetInnerHTML={{ __html: applyInline(item) }} />
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
    return el;
  };

  const applyInline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      const flush = flushList(`list-${i}`);
      if (flush) elements.push(flush);
      elements.push(
        <h2 key={i} className="font-serif text-2xl font-bold text-[#1761a0] mt-10 mb-4">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      const flush = flushList(`list-${i}`);
      if (flush) elements.push(flush);
      elements.push(
        <h3 key={i} className="font-serif text-xl font-bold text-[#1761a0] mt-7 mb-3">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === '') {
      const flush = flushList(`list-${i}`);
      if (flush) elements.push(flush);
    } else {
      const flush = flushList(`list-${i}`);
      if (flush) elements.push(flush);
      elements.push(
        <p
          key={i}
          className="text-stone-700 leading-relaxed mb-5 text-base"
          dangerouslySetInnerHTML={{ __html: applyInline(line) }}
        />
      );
    }
    i++;
  }

  const flush = flushList('list-final');
  if (flush) elements.push(flush);

  return elements;
}

export default async function GuidePage({ params }: PageProps) {
  const { guide: guideSlug } = await params;
  const guide = getGuideBySlug(guideSlug);
  if (!guide) notFound();

  const castles = getCastlesByIds(guide.castles);
  const relatedGuides = getAllGuides().filter((g) => g.id !== guide.id).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[400px] overflow-hidden">
        <Image
          src={guide.hero_image.url}
          alt={guide.hero_image.alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/65" />
        <div className="absolute bottom-0 left-0 p-8 text-white max-w-3xl">
          <p className="text-white/70 text-xs uppercase tracking-wider mb-2">
            {guide.country
              ? guide.country.charAt(0).toUpperCase() + guide.country.slice(1).replace('-', ' ')
              : 'Travel Guide'}
            {' · '}Updated {new Date(guide.last_updated).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">{guide.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Guides', href: '/guides' },
            { label: guide.title },
          ]}
        />

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-12 mt-8">
          {/* Content */}
          <div className="min-w-0">
            <div className="prose-editorial">{renderMarkdown(guide.content)}</div>

            {/* Featured castles grid */}
            {castles.length > 0 && (
              <section className="mt-12">
                <h2 className="font-serif text-2xl font-bold text-[#1761a0] mb-6">
                  Castles in this Guide
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {castles.map((castle) => (
                    <CastleCard key={castle.id} castle={castle} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="mt-10 lg:mt-0 space-y-6 lg:self-start lg:sticky lg:top-24">
            <GYGWidget
              searchQuery={guide.country ? `${guide.country} castle tour` : 'Europe castle tour'}
              title="Recommended Tours"
            />

            {/* Related guides */}
            {relatedGuides.length > 0 && (
              <div className="bg-[#f5f0e8] rounded-lg p-5 border border-stone-200">
                <h3 className="font-serif font-bold text-[#1761a0] text-base mb-4">More Guides</h3>
                <ul className="space-y-3">
                  {relatedGuides.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/guides/${g.id}`}
                        prefetch={false}
                        className="text-sm text-stone-700 hover:text-[#c9a84c] transition-colors leading-snug block"
                      >
                        {g.title} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
