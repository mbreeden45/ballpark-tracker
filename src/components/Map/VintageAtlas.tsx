'use client';

import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup } from 'react-simple-maps';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { PARKS } from '@/lib/parks';
import { CORRIDORS, corridorLegs } from '@/lib/corridors';
import { MAP_HEIGHT, MAP_WIDTH, contextCountryFeatures, createAlbersProjection, usStatesFeatures } from '@/lib/geo';
import { statusOf } from '@/lib/stats';
import { useBallparkStore } from '@/store/useBallparkStore';
import type { Ballpark } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  corridors?: boolean;
}

const DEFAULT_CENTER: [number, number] = [-96, 38.5];
const EXCLUDED_STATE_IDS = new Set(['02', '15', '72', '78', '60', '66', '69']);
const CONTEXT = contextCountryFeatures().features;
const STATES = usStatesFeatures().features.filter((f) => !EXCLUDED_STATE_IDS.has(String(f.id)));

function ParkPin({ park, status, selected, showLabel, scale, onSelect }: {
  park: Ballpark;
  status: string;
  selected: boolean;
  showLabel: boolean;
  scale: number;
  onSelect: (id: string) => void;
}) {
  return (
    <Marker coordinates={park.coordinates}>
      <g
        transform={`scale(${scale})`}
        role="button"
        tabIndex={0}
        aria-label={`${park.venue}, ${park.franchise}: ${status}`}
        className="cursor-pointer outline-none"
        onClick={() => onSelect(park.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(park.id);
          }
        }}
      >
        <circle r={18} fill="transparent" />
        {status === 'visited' && (
          <>
            <circle r={13} fill={park.primaryColor} opacity={0.28} className="animate-glow" style={{ filter: 'blur(3px)' }} />
            <g transform="rotate(45)">
              <rect x={-6.5} y={-6.5} width={13} height={13} rx={1.5} fill={park.primaryColor} stroke="#FBF8F1" strokeWidth={2} />
              <rect x={-6.5} y={-6.5} width={13} height={13} rx={1.5} fill="none" stroke="#E5A823" strokeWidth={0.8} />
            </g>
            <circle r={1.8} fill="#FBF8F1" />
          </>
        )}
        {status === 'wishlist' && (
          <>
            <circle r={7} fill="#FBF8F1" stroke="#C0362C" strokeWidth={1.8} strokeDasharray="2.4 2" strokeLinecap="round" />
            <circle r={2} fill="#C0362C" opacity={0.7} />
          </>
        )}
        {status === 'unvisited' && <circle r={3.6} fill="#8d8676" stroke="#FBF8F1" strokeWidth={1} opacity={0.85} />}
        {selected && <circle r={11} fill="none" stroke="#E5A823" strokeWidth={2} />}
        {(showLabel || selected) && (
          <text
            y={20}
            textAnchor="middle"
            className="font-scoreboard"
            fontSize={9}
            fill="#1E2022"
            stroke="#FBF8F1"
            strokeWidth={2.5}
            paintOrder="stroke"
          >
            {park.abbr}
          </text>
        )}
      </g>
    </Marker>
  );
}

export function VintageAtlas({ corridors = false }: Props) {
  const entries = useBallparkStore((s) => s.entries);
  const selectedId = useBallparkStore((s) => s.drawerParkId);
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [activeCorridor, setActiveCorridor] = useState<string | null>(null);

  const projection = useMemo(() => createAlbersProjection(), []);
  const legs = useMemo(() => CORRIDORS.flatMap((c) => corridorLegs(c)), []);
  const pinScale = 1.7 / Math.sqrt(zoom);
  const badgeScale = 1.25 / Math.sqrt(zoom);

  const corridorParkIds = useMemo(() => {
    const set = new Set<string>();
    CORRIDORS.forEach((c) => c.parkIds.forEach((id) => set.add(id)));
    return set;
  }, []);

  const totalMiles = (id: string) => legs.filter((l) => l.corridorId === id).reduce((n, l) => n + l.miles, 0);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9dfc7]">
      <ComposableMap
        projection={projection as never}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="h-full w-full touch-pan-y"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <pattern id="atlas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="#8B4513" strokeWidth="0.25" opacity="0.25" />
          </pattern>
          <radialGradient id="atlas-vignette" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#8B4513" stopOpacity="0" />
            <stop offset="100%" stopColor="#5E2F0D" stopOpacity="0.28" />
          </radialGradient>
        </defs>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#atlas-grid)" />
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
            {({ geographies }: { geographies: Array<{ rsmKey: string; id?: string }> }) =>
              geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dccfae"
                    stroke="#8B4513"
                    strokeWidth={0.5}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                  />
              ))
            }
          </Geographies>
          <Geographies geography={STATES}>
            {({ geographies }: { geographies: Array<{ rsmKey: string; id?: string }> }) =>
              geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#FBF8F1"
                    stroke="#8B4513"
                    strokeWidth={0.6}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: '#f4ecd8' }, pressed: { outline: 'none' } }}
                />
              ))
            }
          </Geographies>

          {corridors &&
            legs.map((leg) => {
              const dim = activeCorridor !== null && activeCorridor !== leg.corridorId;
              return (
                <Line
                  key={`${leg.from.id}-${leg.to.id}`}
                  from={leg.from.coordinates}
                  to={leg.to.coordinates}
                  stroke={leg.color}
                  strokeWidth={1.8 * pinScale}
                  strokeLinecap="round"
                  strokeDasharray={`${5 * pinScale} ${4 * pinScale}`}
                  opacity={dim ? 0.15 : 0.9}
                />
              );
            })}

          {PARKS.map((park) => {
            const dim = corridors && !corridorParkIds.has(park.id);
            return (
              <g key={park.id} opacity={dim ? 0.45 : 1}>
                <ParkPin
                  park={park}
                  status={statusOf(entries, park.id)}
                  selected={selectedId === park.id}
                  showLabel={zoom >= 2 || corridors}
                  scale={pinScale}
                  onSelect={openDrawer}
                />
              </g>
            );
          })}

          {corridors &&
            legs.map((leg) => {
              const dim = activeCorridor !== null && activeCorridor !== leg.corridorId;
              const mid: [number, number] = [
                (leg.from.coordinates[0] + leg.to.coordinates[0]) / 2,
                (leg.from.coordinates[1] + leg.to.coordinates[1]) / 2,
              ];
              const label = `${leg.miles.toLocaleString()} mi`;
              return (
                <Marker key={`badge-${leg.from.id}-${leg.to.id}`} coordinates={mid}>
                  <g transform={`scale(${badgeScale})`} opacity={dim ? 0.2 : 1} pointerEvents="none">
                    <rect x={-21} y={-8} width={42} height={16} rx={8} fill={leg.color} stroke="#FBF8F1" strokeWidth={1.5} />
                    <text textAnchor="middle" y={3.4} fontSize={9.5} fill="#FBF8F1" className="font-scoreboard">
                      {label}
                    </text>
                  </g>
                </Marker>
              );
            })}
        </ZoomableGroup>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#atlas-vignette)" pointerEvents="none" />
      </ComposableMap>

      <div className="pointer-events-none absolute left-3 top-3 hidden rounded-md border border-infield/40 bg-cream/85 px-3 py-1.5 text-center sm:block">
        <div className="font-display text-sm leading-none text-infield">The Ballpark Atlas</div>
        <div className="font-typewriter text-[10px] uppercase tracking-widest text-ballpark/60">Major League Edition</div>
      </div>

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        {[
          { icon: Plus, label: 'Zoom in', action: () => setZoom((z) => Math.min(8, z * 1.6)) },
          { icon: Minus, label: 'Zoom out', action: () => setZoom((z) => Math.max(1, z / 1.6)) },
          {
            icon: RotateCcw,
            label: 'Reset view',
            action: () => {
              setZoom(1);
              setCenter(DEFAULT_CENTER);
            },
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={action}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-infield/30 bg-cream/95 text-infield shadow-card active:scale-95"
          >
            <Icon size={18} />
          </button>
        ))}
      </div>

      {corridors ? (
        <div className="absolute inset-x-2 bottom-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {CORRIDORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCorridor((cur) => (cur === c.id ? null : c.id))}
              className={cn(
                'shrink-0 rounded-full border-2 bg-cream/95 px-3 py-1.5 text-left text-xs font-bold shadow-card transition',
                activeCorridor === c.id ? 'text-cream' : 'text-ballpark',
              )}
              style={{
                borderColor: c.color,
                backgroundColor: activeCorridor === c.id ? c.color : undefined,
              }}
            >
              {c.name}
              <span className="ml-1.5 font-scoreboard font-normal opacity-80">{totalMiles(c.id).toLocaleString()} mi</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-cream/85 px-3 py-1.5 text-[11px] font-semibold text-ballpark/80">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-8 -8 16 16"><g transform="rotate(45)"><rect x={-5} y={-5} width={10} height={10} fill="#1E4D2B" stroke="#E5A823" /></g></svg>
            Visited
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-8 -8 16 16"><circle r={6} fill="#FBF8F1" stroke="#C0362C" strokeWidth={1.6} strokeDasharray="2.4 2" /></svg>
            Wishlist
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="-8 -8 16 16"><circle r={3.6} fill="#8d8676" /></svg>
            Unvisited
          </span>
        </div>
      )}
    </div>
  );
}
