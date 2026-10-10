'use client';

import { useMemo, useState } from 'react';
import { Line, Marker } from 'react-simple-maps';
import { Bookmark, Check, Map as MapIcon, Route, X } from 'lucide-react';
import { PARKS, getPark } from '@/lib/parks';
import { CORRIDORS, corridorLegs } from '@/lib/corridors';
import { statusOf } from '@/lib/stats';
import { setVisited } from '@/lib/actions';
import { useBallparkStore } from '@/store/useBallparkStore';
import type { MapMode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BaseMap } from './BaseMap';
import { ParkPin } from './ParkPin';

const MODES: { mode: MapMode; label: string; icon: typeof MapIcon }[] = [
  { mode: 'atlas', label: 'All Parks', icon: MapIcon },
  { mode: 'roadtrip', label: 'Road Trips', icon: Route },
];

function ParkPopup({ id, onClose }: { id: string; onClose: () => void }) {
  const park = getPark(id);
  const status = useBallparkStore((s) => s.entries[id]?.status ?? 'unvisited');
  const toggleWishlist = useBallparkStore((s) => s.toggleWishlist);
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  if (!park) return null;
  const visited = status === 'visited';

  return (
    <div className="absolute inset-x-2 bottom-2 z-10 animate-slideUp rounded-xl border border-line bg-white p-3 shadow-pop sm:left-auto sm:w-[340px]">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full" style={{ background: park.primaryColor }} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold leading-tight">{park.venue}</div>
          <div className="truncate text-xs text-muted">
            {park.franchise} · {park.city}, {park.state}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface">
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVisited(id, !visited)}
          aria-pressed={visited}
          className={cn('btn flex-1', visited ? 'bg-ok text-white' : 'bg-navy text-white hover:bg-navy-700')}
        >
          <Check size={18} strokeWidth={3} />
          {visited ? 'Visited' : "I've been here"}
        </button>
        {!visited && (
          <button
            type="button"
            aria-pressed={status === 'wishlist'}
            aria-label="Toggle wishlist"
            onClick={() => toggleWishlist(id)}
            className={cn('btn-ghost !px-3', status === 'wishlist' && '!border-brand !text-brand')}
          >
            <Bookmark size={18} fill={status === 'wishlist' ? 'currentColor' : 'none'} />
          </button>
        )}
        <button type="button" onClick={() => openDrawer(id)} className="btn-ghost !px-3 text-xs">
          Details
        </button>
      </div>
    </div>
  );
}

export function BallparkMap({ className }: { className?: string }) {
  const mode = useBallparkStore((s) => s.activeMapMode);
  const setMode = useBallparkStore((s) => s.setActiveMapMode);
  const entries = useBallparkStore((s) => s.entries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCorridor, setActiveCorridor] = useState<string | null>(null);

  const legs = useMemo(() => CORRIDORS.flatMap((c) => corridorLegs(c)), []);
  const corridorParkIds = useMemo(() => new Set(CORRIDORS.flatMap((c) => c.parkIds)), []);
  const roadtrip = mode === 'roadtrip';

  return (
    <section className={cn('card flex flex-col overflow-hidden', className)} aria-label="Ballpark map">
      <header className="border-b border-line p-2">
        <div role="tablist" aria-label="Map mode" className="flex gap-1 rounded-lg bg-surface p-1">
          {MODES.map(({ mode: m, label, icon: Icon }) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold transition',
                mode === m ? 'bg-navy text-white shadow-card' : 'text-muted hover:text-navy',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <BaseMap
          onBackgroundClick={() => setSelectedId(null)}
          overlay={
            <>
              {selectedId && <ParkPopup id={selectedId} onClose={() => setSelectedId(null)} />}
              {!selectedId && !roadtrip && (
                <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-navy shadow-card">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-ok" /> Visited</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-dashed border-brand" /> Wishlist</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-[#7b8797]" /> Not yet</span>
                </div>
              )}
              {!selectedId && roadtrip && (
                <div className="absolute inset-x-2 bottom-2 flex gap-1.5 overflow-x-auto pb-0.5">
                  {CORRIDORS.map((c) => {
                    const miles = legs.filter((l) => l.corridorId === c.id).reduce((n, l) => n + l.miles, 0);
                    const on = activeCorridor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActiveCorridor((cur) => (cur === c.id ? null : c.id))}
                        className={cn('shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-semibold shadow-card transition', on ? 'text-white' : 'bg-white text-navy')}
                        style={{ borderColor: c.color, backgroundColor: on ? c.color : undefined }}
                      >
                        {c.name} <span className="font-normal opacity-80">{miles.toLocaleString()} mi</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          }
        >
          {(scale) => (
            <>
              {roadtrip &&
                legs.map((leg) => {
                  const dim = activeCorridor !== null && activeCorridor !== leg.corridorId;
                  return (
                    <Line
                      key={`${leg.from.id}-${leg.to.id}`}
                      from={leg.from.coordinates}
                      to={leg.to.coordinates}
                      stroke={leg.color}
                      strokeWidth={1.8 * scale.pin}
                      strokeLinecap="round"
                      strokeDasharray={`${5 * scale.pin} ${4 * scale.pin}`}
                      opacity={dim ? 0.15 : 0.9}
                    />
                  );
                })}
              {PARKS.map((park) => (
                <g key={park.id} opacity={roadtrip && !corridorParkIds.has(park.id) ? 0.4 : 1}>
                  <ParkPin
                    park={park}
                    status={statusOf(entries, park.id)}
                    selected={selectedId === park.id}
                    showLabel={scale.zoom >= 2 || roadtrip}
                    scale={scale.pin}
                    onSelect={setSelectedId}
                  />
                </g>
              ))}
              {roadtrip &&
                legs.map((leg) => {
                  const dim = activeCorridor !== null && activeCorridor !== leg.corridorId;
                  const mid: [number, number] = [(leg.from.coordinates[0] + leg.to.coordinates[0]) / 2, (leg.from.coordinates[1] + leg.to.coordinates[1]) / 2];
                  return (
                    <Marker key={`badge-${leg.from.id}-${leg.to.id}`} coordinates={mid}>
                      <g transform={`scale(${scale.badge})`} opacity={dim ? 0.2 : 1} pointerEvents="none">
                        <rect x={-21} y={-8} width={42} height={16} rx={8} fill={leg.color} stroke="#FFFFFF" strokeWidth={1.5} />
                        <text textAnchor="middle" y={3.5} fontSize={9.5} fontWeight={700} fill="#FFFFFF">
                          {leg.miles.toLocaleString()} mi
                        </text>
                      </g>
                    </Marker>
                  );
                })}
            </>
          )}
        </BaseMap>
      </div>
    </section>
  );
}
