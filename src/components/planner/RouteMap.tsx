'use client';

import { Line, Marker } from 'react-simple-maps';
import { BaseMap } from '@/components/Map/BaseMap';
import { PARKS } from '@/lib/parks';
import type { HomePoint, Itinerary } from '@/lib/planner/types';

interface Props {
  itinerary: Itinerary;
  home: HomePoint | null;
  className?: string;
}

export function RouteMap({ itinerary, home, className }: Props) {
  const points: [number, number][] = [
    ...(home ? [home.coordinates] : []),
    ...itinerary.stops.map((s) => s.park.coordinates),
    ...(home && itinerary.returnLeg ? [home.coordinates] : []),
  ];
  const stopIds = new Set(itinerary.stops.map((s) => s.park.id));

  const segments: { from: [number, number]; to: [number, number]; fly: boolean }[] = [];
  itinerary.stops.forEach((stop, i) => {
    const prev = i === 0 ? home?.coordinates : itinerary.stops[i - 1].park.coordinates;
    if (prev) segments.push({ from: prev, to: stop.park.coordinates, fly: stop.leg?.mode === 'fly' });
  });
  if (home && itinerary.returnLeg) {
    const last = itinerary.stops[itinerary.stops.length - 1];
    segments.push({ from: last.park.coordinates, to: home.coordinates, fly: itinerary.returnLeg.mode === 'fly' });
  }

  return (
    <div className={className}>
      <BaseMap fit={points}>
        {(scale) => (
          <>
            {PARKS.filter((p) => !stopIds.has(p.id)).map((p) => (
              <Marker key={p.id} coordinates={p.coordinates}>
                <circle r={3 * scale.pin} fill="#c5cfdb" stroke="#ffffff" strokeWidth={1} />
              </Marker>
            ))}
            {segments.map((seg, i) => (
              <Line
                key={`${i}-${seg.from.join()}-${seg.to.join()}`}
                from={seg.from}
                to={seg.to}
                stroke={seg.fly ? '#BF0D3E' : '#041E42'}
                strokeWidth={2 * scale.pin}
                strokeLinecap="round"
                strokeDasharray={seg.fly ? `${5 * scale.pin} ${4 * scale.pin}` : undefined}
                opacity={0.85}
              />
            ))}
            {home && (
              <Marker coordinates={home.coordinates}>
                <g transform={`scale(${scale.pin})`}>
                  <rect x={-7} y={-7} width={14} height={14} rx={3} fill="#ffffff" stroke="#041E42" strokeWidth={2} />
                  <path d="M-3.5 1l3.5-3.5 3.5 3.5M-2.5 0v3.5h5V0" fill="none" stroke="#041E42" strokeWidth={1.4} strokeLinejoin="round" />
                </g>
              </Marker>
            )}
            {itinerary.stops.map((s, i) => (
              <Marker key={s.game.gamePk} coordinates={s.park.coordinates}>
                <g transform={`scale(${scale.pin})`}>
                  <circle r={10} fill={s.park.primaryColor} stroke="#ffffff" strokeWidth={2.5} />
                  <text textAnchor="middle" y={4} fontSize={11} fontWeight={800} fill="#ffffff">
                    {i + 1}
                  </text>
                  <text y={22} textAnchor="middle" fontSize={9} fontWeight={700} fill="#041E42" stroke="#fff" strokeWidth={2.6} paintOrder="stroke">
                    {s.park.abbr}
                  </text>
                </g>
              </Marker>
            ))}
          </>
        )}
      </BaseMap>
    </div>
  );
}
