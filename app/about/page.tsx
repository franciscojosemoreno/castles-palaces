import type { Metadata } from 'next';
import { getAllCastles } from '@/lib/castles';
import { getAllCountries } from '@/lib/countries';

export const metadata: Metadata = {
  title: 'About Castles & Palaces',
  description: 'The editorial guide to Europe\'s most beautiful historic castles and palaces.',
};

export default function AboutPage() {
  const castleCount = Math.floor(getAllCastles().length / 100) * 100;
  const countryCount = getAllCountries().length;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-2">Our Story</p>
      <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-6">About Castles &amp; Palaces</h1>

      <div className="prose-editorial space-y-4 text-stone-600">
        <p>
          Castles &amp; Palaces is the world&apos;s most comprehensive independent guide to Europe&apos;s fortresses, royal palaces and medieval castles — over {castleCount} historic sites across {countryCount}{' '}countries, each one individually verified as genuinely visitable, with a real ticket, tour or entrance product behind it. It&apos;s the depth of coverage no other specialized guide in this niche has matched.
        </p>
        <p>
          The motivation for this project came from a real problem many travelers face. Search for castles, palaces or fortresses on any of the major travel platforms, and there&apos;s no real way to filter for them — not by attraction, not by country, not by anything. The landmarks worth visiting are buried inside generic city tours and day-trip listings, if you can find them at all. Castles &amp; Palaces is the catalogue that fixes that: real research and real verification for every single site, organized the way people who actually love this niche think about their trips. And it&apos;s not a one-time project — we&apos;re adding new castles, palaces and tours on an ongoing basis.
        </p>
        <p>
          We started as an Instagram account — <strong>@castlespalaces</strong> — sharing photography from Europe&apos;s most dramatic historic sites. With over 100,000 followers who come to us for inspiration, we built this site to give that same community the practical depth to actually plan their visits, and to become the reference point for anyone serious about Europe&apos;s castle and palace heritage.
        </p>
        <p>
          Every castle page is written to answer the questions real visitors ask: Do I need to book ahead? How long does it take? What&apos;s the best view? What&apos;s the history? We link to official ticket sources and partner with GetYourGuide to surface the best guided tours for each site.
        </p>
        <p>
          This site uses affiliate links with GetYourGuide. When you book a tour through our links, we earn a small commission at no additional cost to you. This is what keeps the site free and independent.
        </p>

        <div className="mt-10 pt-8 border-t border-stone-200">
          <h2 className="font-serif font-semibold text-[#1761a0] text-xl mb-3">Legal Notice</h2>
          <p className="text-stone-600">
            Castles &amp; Palaces is operated by Castles Palaces (Francisco José Moreno), Migueletes, Buenos Aires, Argentina.
            Contact: <a href="mailto:castlespalacesfm@gmail.com" className="text-[#1761a0] underline hover:text-[#c9a84c] transition-colors">castlespalacesfm@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
