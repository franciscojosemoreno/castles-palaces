'use client';

import Script from 'next/script';

interface GYGWidgetProps {
  locationId?: string;
  searchQuery?: string;
  numResults?: number;
  widgetType?: string;
  title?: string;
}

const GYG_PARTNER_ID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? 'YOUR_PARTNER_ID';

export default function GYGWidget({
  locationId,
  searchQuery,
  numResults = 4,
  widgetType = 'activities',
  title = 'Tours & Tickets',
}: GYGWidgetProps) {
  // Prioritise castle-specific search query over generic city location ID.
  // When both are provided, using only the query gives far more relevant results.
  const useSearch = Boolean(searchQuery);
  const useLocation = !useSearch && Boolean(locationId);

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <h2 className="font-serif font-bold text-[#1761a0] text-xl mb-4">{title}</h2>

      <div
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-locale-code="en-US"
        data-gyg-widget={widgetType}
        data-gyg-number-of-items={String(numResults)}
        data-gyg-partner-id={GYG_PARTNER_ID}
        {...(useLocation ? { 'data-gyg-location-id': locationId } : {})}
        {...(useSearch ? { 'data-gyg-q': searchQuery } : {})}
        className="min-h-[200px]"
      />

      <Script
        src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
        data-gyg-partner-id={GYG_PARTNER_ID}
        strategy="lazyOnload"
      />

      <p className="mt-3 text-xs text-stone-400 text-center">
        Powered by{' '}
        <a href="https://www.getyourguide.com" target="_blank" rel="noopener noreferrer sponsored" className="hover:text-[#c9a84c]">
          GetYourGuide
        </a>
      </p>
    </div>
  );
}
