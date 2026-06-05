'use client';

import { useEffect, useRef } from 'react';

interface CastleMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function CastleMap({ lat, lng, name }: CastleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || initializingRef.current) return;
    initializingRef.current = true;

    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      if (!mapRef.current || mapInstanceRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current).setView([lat, lng], 13);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>`)
        .openPopup();
    });

    return () => {
      initializingRef.current = false;
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name]);

  return (
    <div
      ref={mapRef}
      className="w-full h-72 rounded-lg overflow-hidden border border-stone-200"
      aria-label={`Map showing location of ${name}`}
    />
  );
}
