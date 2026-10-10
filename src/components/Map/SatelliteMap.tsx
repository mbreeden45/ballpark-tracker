'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Globe2 } from 'lucide-react';
import { PARKS, getPark } from '@/lib/parks';
import { statusOf } from '@/lib/stats';
import { useBallparkStore } from '@/store/useBallparkStore';

const ESRI_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const US_VIEW = { center: [-96, 38.5] as [number, number], zoom: 3, pitch: 0, bearing: 0 };

function pinMarkup(color: string, status: string): string {
  if (status === 'visited') {
    return `<svg width="34" height="34" viewBox="-17 -17 34 34"><circle r="14" fill="${color}" opacity=".35"/><g transform="rotate(45)"><rect x="-7.5" y="-7.5" width="15" height="15" rx="2" fill="${color}" stroke="#FBF8F1" stroke-width="2.4"/></g><circle r="2.2" fill="#FBF8F1"/></svg>`;
  }
  if (status === 'wishlist') {
    return `<svg width="30" height="30" viewBox="-15 -15 30 30"><circle r="9" fill="#FBF8F1" stroke="#C0362C" stroke-width="2.4" stroke-dasharray="3.2 2.6"/><circle r="2.4" fill="#C0362C"/></svg>`;
  }
  return `<svg width="26" height="26" viewBox="-13 -13 26 26"><circle r="5.4" fill="#d9d2c0" stroke="#1E2022" stroke-width="1.6" opacity=".9"/></svg>`;
}

function bearingFor(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (h % 120) - 60;
}

export function SatelliteMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, { marker: MapLibreMarker; el: HTMLButtonElement }>>(new Map());
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const entries = useBallparkStore((s) => s.entries);
  const selectedId = useBallparkStore((s) => s.drawerParkId);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;
    let resizer: ResizeObserver | null = null;
    const markers = markersRef.current;

    void (async () => {
      const container = containerRef.current;
      if (!container) return;
      try {
        const maplibre = await import('maplibre-gl');
        if (cancelled) return;
        map = new maplibre.Map({
          container,
          style: {
            version: 8,
            sources: {
              esri: {
                type: 'raster',
                tiles: [ESRI_TILES],
                tileSize: 256,
                maxzoom: 19,
                attribution: 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community',
              },
            },
            layers: [{ id: 'esri-imagery', type: 'raster', source: 'esri' }],
          },
          center: US_VIEW.center,
          zoom: US_VIEW.zoom,
          pitch: US_VIEW.pitch,
          maxPitch: 75,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-left');
        mapRef.current = map;

        for (const park of PARKS) {
          const el = document.createElement('button');
          el.type = 'button';
          el.setAttribute('aria-label', `Fly to ${park.venue}`);
          el.style.cssText = 'background:none;border:0;padding:0;cursor:pointer;display:block;line-height:0;';
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            useBallparkStore.getState().openDrawer(park.id);
          });
          const marker = new maplibre.Marker({ element: el, anchor: 'center' }).setLngLat(park.coordinates).addTo(map);
          markers.set(park.id, { marker, el });
        }

        resizer = new ResizeObserver(() => map?.resize());
        resizer.observe(container);
        map.on('load', () => !cancelled && setReady(true));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      resizer?.disconnect();
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Keep marker art in sync with status.
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      const park = getPark(id);
      if (!park) return;
      el.innerHTML = pinMarkup(park.primaryColor, statusOf(entries, id));
      el.style.zIndex = statusOf(entries, id) === 'visited' ? '2' : '1';
    });
  }, [entries, ready]);

  // Fly the camera over the selected park.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const park = getPark(selectedId);
    if (!park) return;
    const narrow = typeof window !== 'undefined' && window.innerWidth < 1024;
    map.flyTo({
      center: park.coordinates,
      zoom: 17.4,
      pitch: 64,
      bearing: bearingFor(park.id),
      duration: 3400,
      curve: 1.6,
      essential: true,
      padding: narrow ? { top: 0, left: 0, right: 0, bottom: Math.round(map.getContainer().clientHeight * 0.3) } : { top: 0, left: 0, bottom: 0, right: 0 },
    });
  }, [selectedId, ready]);

  const resetView = () => {
    mapRef.current?.flyTo({ ...US_VIEW, duration: 2200, essential: true, padding: { top: 0, left: 0, right: 0, bottom: 0 } });
  };

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-ballpark p-6 text-center text-cream">
        <Globe2 size={32} />
        <p className="font-display text-lg">Satellite feed unavailable</p>
        <p className="max-w-xs text-sm text-cream/70">This browser could not start WebGL. Switch to the Vintage Atlas to keep logging parks.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-ballpark">
      <div className="absolute inset-0">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-ballpark/80 font-typewriter text-sm text-cream">
          Warming up the satellite…
        </div>
      )}
      <button
        type="button"
        onClick={resetView}
        className="absolute right-3 top-3 rounded-full border-2 border-cream/60 bg-ballpark/80 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cream backdrop-blur active:scale-95"
      >
        Full League
      </button>
      <div className="pointer-events-none absolute inset-x-2 bottom-6 text-center">
        <span className="rounded-full bg-ballpark/75 px-3 py-1.5 font-typewriter text-[11px] uppercase tracking-widest text-cream">
          Tap a park to fly over home plate
        </span>
      </div>
    </div>
  );
}
