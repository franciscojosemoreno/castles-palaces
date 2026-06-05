import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Castles & Palaces',
  description: 'The editorial guide to Europe\'s most beautiful historic castles and palaces.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <p className="text-[#c9a84c] font-medium text-sm uppercase tracking-wider mb-2">Our Story</p>
      <h1 className="font-serif text-4xl font-bold text-[#1761a0] mb-6">About Castles &amp; Palaces</h1>

      <div className="prose-editorial space-y-4 text-stone-600">
        <p>
          Castles &amp; Palaces is an independent editorial guide to Europe&apos;s most spectacular historic fortresses, royal palaces and medieval châteaux. We cover 500+ sites across 20 countries, with practical visitor information and honest editorial content.
        </p>
        <p>
          We started as an Instagram account — <strong>@castlespalaces</strong> — sharing photography from Europe&apos;s most dramatic historic sites. With over 100,000 followers who come to us for inspiration, we built this site to give that same community the practical depth to actually plan their visits.
        </p>
        <p>
          Every castle page is written to answer the questions real visitors ask: Do I need to book ahead? How long does it take? What&apos;s the best view? What&apos;s the history? We link to official ticket sources and partner with GetYourGuide to surface the best guided tours for each site.
        </p>
        <p>
          This site uses affiliate links with GetYourGuide. When you book a tour through our links, we earn a small commission at no additional cost to you. This is what keeps the site free and independent.
        </p>
      </div>
    </div>
  );
}
