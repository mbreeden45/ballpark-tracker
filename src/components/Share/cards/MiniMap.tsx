import { useMemo, type ReactNode } from 'react';
import type { GeoProjection } from 'd3-geo';
import { PARKS } from '@/lib/parks';
import { buildStaticPaths, createAlbersProjection, type StaticMapPaths } from '@/lib/geo';
import type { ParkEntry } from '@/lib/types';
import type { ShareTheme } from '@/lib/shareTypes';
import { TOKENS } from './theme';

let shared: { projection: GeoProjection; paths: StaticMapPaths } | null = null;
function getShared() {
  if (!shared) {
    const projection = createAlbersProjection();
    shared = { projection, paths: buildStaticPaths(projection) };
  }
  return shared;
}

export const FULL_VIEW: [number, number, number, number] = [55, 35, 830, 540];

interface Props {
  theme: ShareTheme;
  entries?: Record<string, ParkEntry | undefined>;
  /** Pin radius in map units; larger values read better on small cards. */
  pinR?: number;
  view?: [number, number, number, number];
  /** Extra layer drawn over the map (routes, numbered stops). */
  overlay?: (projection: GeoProjection) => ReactNode;
  showPins?: boolean;
  glow?: boolean;
}

export function MiniMap({ theme, entries = {}, pinR = 12, view = FULL_VIEW, overlay, showPins = true, glow = true }: Props) {
  const { projection, paths } = getShared();
  const t = TOKENS[theme];
  const pins = useMemo(
    () =>
      PARKS.map((p) => {
        const xy = projection(p.coordinates);
        return xy ? { park: p, x: xy[0], y: xy[1], visited: entries[p.id]?.status === 'visited' } : null;
      }).filter((p): p is NonNullable<typeof p> => p !== null),
    [entries, projection],
  );

  return (
    <svg
      viewBox={view.join(' ')}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        {PARKS.map((p) => (
          <radialGradient key={p.id} id={`glow-${p.id}`}>
            <stop offset="0%" stopColor={p.primaryColor} stopOpacity={theme === 'dark' ? 0.75 : 0.5} />
            <stop offset="100%" stopColor={p.primaryColor} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {paths.context.map((d, i) => (
        <path key={`c${i}`} d={d} fill={t.context} stroke={t.stroke} strokeWidth={0.6} />
      ))}
      {paths.states.map((d, i) => (
        <path key={`s${i}`} d={d} fill={t.land} stroke={t.stroke} strokeWidth={0.8} />
      ))}
      {showPins &&
        pins
          .filter((p) => !p.visited)
          .map((p) => <circle key={p.park.id} cx={p.x} cy={p.y} r={pinR * 0.42} fill={t.pinOff} />)}
      {showPins &&
        pins
          .filter((p) => p.visited)
          .map((p) => (
            <g key={p.park.id} transform={`translate(${p.x} ${p.y})`}>
              {glow && <circle r={pinR * 2.8} fill={`url(#glow-${p.park.id})`} />}
              <circle r={pinR + 2.5} fill="#FFFFFF" />
              <circle r={pinR} fill={p.park.primaryColor} />
              <circle r={pinR * 0.34} fill="#FFFFFF" />
            </g>
          ))}
      {overlay?.(projection)}
    </svg>
  );
}
