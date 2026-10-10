'use client';

import { Marker } from 'react-simple-maps';
import type { Ballpark, ParkStatus } from '@/lib/types';

interface Props {
  park: Ballpark;
  status: ParkStatus;
  selected: boolean;
  showLabel: boolean;
  scale: number;
  onSelect: (id: string) => void;
}

export function ParkPin({ park, status, selected, showLabel, scale, onSelect }: Props) {
  return (
    <Marker coordinates={park.coordinates}>
      <g
        transform={`scale(${scale})`}
        role="button"
        tabIndex={0}
        aria-label={`${park.venue}, ${park.franchise}: ${status}`}
        className="cursor-pointer outline-none"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(park.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(park.id);
          }
        }}
      >
        <circle r={14} fill="transparent" />
        {selected && <circle r={11} fill="none" stroke="#041E42" strokeWidth={1.6} />}
        {status === 'visited' && (
          <>
            <circle r={8} fill={park.primaryColor} stroke="#FFFFFF" strokeWidth={2} />
            <path d="M-3.4 0.2l2.4 2.4 4.4-4.8" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {status === 'wishlist' && (
          <>
            <circle r={7} fill="#FFFFFF" stroke="#BF0D3E" strokeWidth={1.8} strokeDasharray="3 2" />
            <circle r={2.2} fill="#BF0D3E" />
          </>
        )}
        {status === 'unvisited' && <circle r={5} fill="#FFFFFF" stroke="#7b8797" strokeWidth={1.8} />}
        {(showLabel || selected) && (
          <text y={20} textAnchor="middle" fontSize={9} fontWeight={700} fill="#041E42" stroke="#FFFFFF" strokeWidth={2.6} paintOrder="stroke">
            {park.abbr}
          </text>
        )}
      </g>
    </Marker>
  );
}
