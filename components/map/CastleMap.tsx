'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerClusterer, Marker, InfoWindow } from '@react-google-maps/api';
import Link from 'next/link';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const MAP_CENTER = { lat: 48.5, lng: 13.0 };
const MAP_OPTIONS = {
  zoom: 5,
  minZoom: 3,
  maxZoom: 16,
  mapTypeId: 'roadmap',
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', stylers: [{ color: '#b8d4e8' }] },
    { featureType: 'landscape', stylers: [{ color: '#f5f0e8' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#c9a84c', weight: 1 }] },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const COUNTRY_LABELS: Record<string, string> = {
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  'northern-ireland': 'N. Ireland',
  france: 'France',
  germany: 'Germany',
  spain: 'Spain',
  italy: 'Italy',
  portugal: 'Portugal',
  austria: 'Austria',
  'czech-republic': 'Czech Rep.',
  poland: 'Poland',
  hungary: 'Hungary',
  romania: 'Romania',
  greece: 'Greece',
  switzerland: 'Switzerland',
  belgium: 'Belgium',
  netherlands: 'Netherlands',
  denmark: 'Denmark',
  sweden: 'Sweden',
  norway: 'Norway',
  finland: 'Finland',
  ireland: 'Ireland',
  croatia: 'Croatia',
  slovenia: 'Slovenia',
  slovakia: 'Slovakia',
  bulgaria: 'Bulgaria',
  serbia: 'Serbia',
  albania: 'Albania',
  lithuania: 'Lithuania',
  latvia: 'Latvia',
  estonia: 'Estonia',
  luxembourg: 'Luxembourg',
  montenegro: 'Montenegro',
  turkey: 'Turkey',
  georgia: 'Georgia',
  'north-macedonia': 'N. Macedonia',
  bosnia: 'Bosnia',
  cyprus: 'Cyprus',
};

type CastlePin = {
  id: string;
  name: string;
  country: string;
  slug: string;
  lat: number;
  lng: number;
  type: string;
  tagline: string;
  price_adult?: number;
  unesco: boolean;
  tags: string[];
  hero_image: string;
};

const CLUSTER_SVG = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#1761a0" stroke="#ffffff" stroke-width="2"/></svg>'
);

export default function CastleMap({ castles }: { castles: CastlePin[] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [selectedCastle, setSelectedCastle] = useState<CastlePin | null>(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUnescoOnly, setFilterUnescoOnly] = useState(false);
  const [filterFreeOnly, setFilterFreeOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const countries = [...new Set(castles.map(c => c.country))].sort();

  const filtered = castles.filter(c => {
    if (filterCountry && c.country !== filterCountry) return false;
    if (filterType && c.type !== filterType) return false;
    if (filterUnescoOnly && !c.unesco) return false;
    if (filterFreeOnly && c.price_adult !== 0) return false;
    return true;
  });

  const markerIcon = (type: string, isSelected: boolean) => ({
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: isSelected ? '#c9a84c' : (type === 'palace' ? '#1761a0' : type === 'fortress' ? '#7c3f1e' : '#1a6b3a'),
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: isSelected ? 1.8 : 1.3,
    anchor: { x: 12, y: 24 } as google.maps.Point,
  });

  const hasActiveFilters = filterCountry || filterType || filterUnescoOnly || filterFreeOnly;

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f5f0e8]">
        <p className="text-stone-500 font-serif text-lg">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden relative">

      {/* ── Filter sidebar ── */}
      <div className={`
        absolute lg:relative z-20 top-0 left-0 h-full bg-white shadow-lg border-r border-stone-200
        transition-all duration-300 overflow-y-auto
        ${sidebarOpen ? 'w-72' : 'w-0 lg:w-72'}
      `}>
        <div className="p-5 min-w-[18rem]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif font-bold text-[#1761a0] text-lg">Filter Castles</h2>
            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
              {filtered.length} / {castles.length}
            </span>
          </div>

          {/* Country */}
          <div className="mb-4">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-500 block mb-1.5">Country</label>
            <select
              value={filterCountry}
              onChange={e => setFilterCountry(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-[#c9a84c]"
            >
              <option value="">All countries</option>
              {countries.map(c => (
                <option key={c} value={c}>{COUNTRY_LABELS[c] ?? c}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-500 block mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {['', 'castle', 'palace', 'fortress', 'chateau', 'ruins'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filterType === t
                      ? 'bg-[#1761a0] text-white border-[#1761a0]'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-[#c9a84c]'
                  }`}
                >
                  {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFilterUnescoOnly(!filterUnescoOnly)}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${filterUnescoOnly ? 'bg-[#c9a84c]' : 'bg-stone-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filterUnescoOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-stone-700">UNESCO only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFilterFreeOnly(!filterFreeOnly)}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${filterFreeOnly ? 'bg-[#c9a84c]' : 'bg-stone-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filterFreeOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-stone-700">Free entry only</span>
            </label>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCountry(''); setFilterType(''); setFilterUnescoOnly(false); setFilterFreeOnly(false); }}
              className="mt-5 w-full text-xs text-stone-400 hover:text-[#c9a84c] transition-colors underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Toggle sidebar button (mobile) ── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-3 left-3 z-30 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm font-medium text-[#1761a0] shadow-sm flex items-center gap-2"
      >
        {sidebarOpen ? '✕ Close' : '⚙ Filters'}
        {hasActiveFilters && (
          <span className="bg-[#c9a84c] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">!</span>
        )}
      </button>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={MAP_CENTER}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
          onClick={() => setSelectedCastle(null)}
        >
          <MarkerClusterer
            options={{
              imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
              maxZoom: 10,
              gridSize: 50,
              styles: [{
                width: 40,
                height: 40,
                textColor: '#ffffff',
                textSize: 13,
                url: CLUSTER_SVG,
              }],
            }}
          >
            {(clusterer) => (
              <>
                {filtered.map(castle => (
                  <Marker
                    key={castle.id}
                    position={{ lat: castle.lat, lng: castle.lng }}
                    clusterer={clusterer}
                    icon={markerIcon(castle.type, selectedCastle?.id === castle.id)}
                    onClick={() => setSelectedCastle(castle)}
                    title={castle.name}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>

          {selectedCastle && (
            <InfoWindow
              position={{ lat: selectedCastle.lat + 0.15, lng: selectedCastle.lng }}
              onCloseClick={() => setSelectedCastle(null)}
              options={{ maxWidth: 280 }}
            >
              <div className="p-1">
                <div className="relative w-full aspect-[16/9] rounded overflow-hidden mb-2">
                  <img
                    src={selectedCastle.hero_image}
                    alt={selectedCastle.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedCastle.unesco && (
                    <span className="absolute top-1.5 left-1.5 bg-[#1761a0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">UNESCO</span>
                  )}
                </div>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">
                  {COUNTRY_LABELS[selectedCastle.country] ?? selectedCastle.country} · {selectedCastle.type}
                </p>
                <p className="font-serif font-bold text-[#1761a0] text-sm leading-tight mb-1">{selectedCastle.name}</p>
                <p className="text-stone-500 text-xs leading-relaxed mb-2 line-clamp-2">{selectedCastle.tagline}</p>
                {selectedCastle.price_adult !== undefined && (
                  <p className="text-xs text-stone-600 mb-2">
                    {selectedCastle.price_adult === 0 ? '🎟 Free entry' : `🎟 From €${selectedCastle.price_adult}`}
                  </p>
                )}
                <a
                  href={`/castles/${selectedCastle.country}/${selectedCastle.slug}`}
                  className="block w-full text-center bg-[#1761a0] text-white text-xs font-bold px-3 py-2 rounded hover:bg-[#0f4f8a] transition-colors"
                >
                  View Castle →
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
