'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { MAP_HEIGHT, MAP_WIDTH, contextCountryFeatures, createAlbersProjection, usStatesFeatures } from '@/lib/geo';

const DEFAULT_CENTER: [number, number] = [-96, 38.5];
const EXCLUDED_STATE_IDS = new Set(['02', '15', '72', '78', '60', '66', '69']);
const CONTEXT = contextCountryFeatures().features;
const STATES = usStatesFeatures().features.filter((f) => !EXCLUDED_STATE_IDS.has(String(f.id)));

export interface MapScale {
  zoom: number;
  /** Multiplier for pins and labels so they stay a readable size while zooming. */
  pin: number;
  badge: number;
}

interface Props {
  children: (scale: MapScale) => ReactNode;
  onBackgroundClick?: () => void;
  overlay?: ReactNode;
  /** Longitude/latitude points the initial view should frame (e.g. a trip route). */
  fit?: [number, number][];
}

type Geo = { rsmKey: string };
const NO_OUTLINE = { default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } } as const;

export function BaseMap({ children, onBackgroundClick, overlay, fit }: Props) {
  const projection = useMemo(() => createAlbersProjection(), []);
  const fitKey = fit?.map((p) => p.join(',')).join(';') ?? '';
  const home = useMemo<{ zoom: number; center: [number, number] }>(() => {
    if (!fit || fit.length === 0) return { zoom: 1, center: DEFAULT_CENTER };
    const pts = fit.map((p) => projection(p)).filter((p): p is [number, number] => p !== null);
    if (!pts.length) return { zoom: 1, center: DEFAULT_CENTER };
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const w = Math.max(60, Math.max(...xs) - Math.min(...xs));
    const h = Math.max(60, Math.max(...ys) - Math.min(...ys));
    const zoom = Math.max(1, Math.min(6, 0.7 * Math.min(MAP_WIDTH / w, MAP_HEIGHT / h)));
    const mid = projection.invert?.([(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2]);
    return { zoom, center: (mid as [number, number] | null | undefined) ?? DEFAULT_CENTER };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, projection]);
  const [zoom, setZoom] = useState(home.zoom);
  const [center, setCenter] = useState<[number, number]>(home.center);
  useEffect(() => {
    setZoom(home.zoom);
    setCenter(home.center);
  }, [home]);
  const scale: MapScale = { zoom, pin: 1.6 / Math.sqrt(zoom), badge: 1.2 / Math.sqrt(zoom) };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e4ebf3]">
      <ComposableMap
        projection={projection as never}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        onClick={onBackgroundClick}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={({ coordinates, zoom: z }: { coordinates: [number, number]; zoom: number }) => {
            setCenter(coordinates);
            setZoom(z);
          }}
        >
          <Geographies geography={CONTEXT}>
            {({ geographies }: { geographies: Geo[] }) =>
              geographies.map((geo) => (
                <Geography key={geo.rsmKey} geography={geo} fill="#eef1f5" stroke="#9aa8ba" strokeWidth={0.5} style={NO_OUTLINE} />
              ))
            }
          </Geographies>
          <Geographies geography={STATES}>
            {({ geographies }: { geographies: Geo[] }) =>
              geographies.map((geo) => (
                <Geography key={geo.rsmKey} geography={geo} fill="#ffffff" stroke="#9aa8ba" strokeWidth={0.6} style={NO_OUTLINE} />
              ))
            }
          </Geographies>
          {children(scale)}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        {[
          { icon: Plus, label: 'Zoom in', action: () => setZoom((z) => Math.min(8, z * 1.6)) },
          { icon: Minus, label: 'Zoom out', action: () => setZoom((z) => Math.max(1, z / 1.6)) },
          {
            icon: RotateCcw,
            label: 'Reset view',
            action: () => {
              setZoom(home.zoom);
              setCenter(home.center);
            },
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={action}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy shadow-card active:scale-95"
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
      {overlay}
    </div>
  );
}
