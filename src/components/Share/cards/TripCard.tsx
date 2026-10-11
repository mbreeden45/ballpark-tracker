import { forwardRef } from 'react';
import type { CardData, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { createAlbersProjection } from '@/lib/geo';
import type { Itinerary } from '@/lib/planner/types';
import { formatDate } from '@/lib/utils';
import { CardFrame } from './CardFrame';
import { FULL_VIEW, MiniMap } from './MiniMap';
import { F, TOKENS } from './theme';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const TripCard = forwardRef<HTMLDivElement, Props>(function TripCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const t = TOKENS[theme];
  const trip = data.trip;
  if (!trip) return <CardFrame ref={ref} format={format} theme={theme} host={data.host}>{null}</CardFrame>;

  const { itinerary: it, home } = trip;
  const first = it.stops[0].game.date;
  const last = it.stops[it.stops.length - 1].game.date;
  const range = first === last ? formatDate(first, { month: 'short', day: 'numeric' }) : `${formatDate(first, { month: 'short', day: 'numeric' })} – ${formatDate(last, { month: 'short', day: 'numeric' })}`;
  const shown = it.stops.slice(0, story ? 6 : 5);

  const mapAspect = story ? 312 / 190 : 1;

  return (
    <CardFrame ref={ref} format={format} theme={theme} host={data.host}>
      <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 700, color: t.muted }}>BASEBALL ROAD TRIP</div>
      <div style={{ fontFamily: F.display, fontWeight: 700, textTransform: 'uppercase', lineHeight: 0.95, fontSize: story ? 54 : 34 }}>{range}</div>
      <div style={{ display: 'flex', gap: 14, margin: '8px 0', fontFamily: F.display, fontWeight: 700 }}>
        {[
          [it.stops.length, 'GAMES'],
          [it.newParks, 'NEW PARKS'],
          [it.totalMiles.toLocaleString(), 'MILES'],
        ].map(([v, l]) => (
          <div key={String(l)} style={{ lineHeight: 1 }}>
            <div style={{ fontSize: story ? 34 : 24 }}>{v}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', color: t.muted, fontFamily: F.body, fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 10, flexDirection: story ? 'column' : 'row' }}>
        <div style={{ position: 'relative', flex: story ? '1 1 0' : '0 0 150px', minHeight: story ? 110 : undefined, height: story ? undefined : '100%', background: t.mapBg || t.panel, borderRadius: 8, overflow: 'hidden', width: story ? '100%' : 150 }}>
          <MiniMap
            theme={theme}
            showPins={false}
            view={tripView(trip.itinerary, home?.coordinates, mapAspect)}
            overlay={(proj) => {
              const pts = [
                ...(home ? [{ xy: proj(home.coordinates), label: 'H', color: '#FFFFFF' }] : []),
                ...it.stops.map((s, i) => ({ xy: proj(s.park.coordinates), label: String(i + 1), color: s.park.primaryColor })),
              ];
              const line = pts.filter((p) => p.xy).map((p) => (p.xy as [number, number]).join(',')).join(' ');
              const homeXy = home ? proj(home.coordinates) : null;
              const viewW = tripView(trip.itinerary, home?.coordinates, mapAspect)[2];
              const k = viewW / (story ? 312 : 150);
              return (
                <>
 {it.hub && homeXy
                    ? pts.slice(1).map((p, i) => p.xy && <line key={i} x1={homeXy[0]} y1={homeXy[1]} x2={p.xy[0]} y2={p.xy[1]} stroke={t.accent} strokeWidth={2.4 * k} strokeDasharray={`${7 * k} ${5 * k}`} strokeLinecap="round" />)
                    : <polyline points={line} fill="none" stroke={t.accent} strokeWidth={2.4 * k} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${7 * k} ${5 * k}`} />}
                  {pts.map((p, i) =>
                    p.xy ? (
                      <g key={i} transform={`translate(${p.xy[0]} ${p.xy[1]})`}>
                        <circle r={9 * k} fill={p.color} stroke="#fff" strokeWidth={2 * k} />
                        <text textAnchor="middle" y={3.4 * k} fontSize={10 * k} fontWeight={800} fill={p.label === 'H' ? '#041E42' : '#fff'}>
                          {p.label}
                        </text>
                      </g>
                    ) : null,
                  )}
                </>
              );
            }}
          />
        </div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, flex: story ? 'none' : 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: story ? 5 : 3 }}>
          {shown.map((s, i) => (
            <li key={s.game.gamePk} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: story ? 12 : 10.5, minWidth: 0 }}>
              <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: 999, background: s.park.primaryColor, color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <span style={{ fontWeight: 800, width: story ? 56 : 44, flexShrink: 0 }}>{formatDate(s.game.date, { month: 'short', day: 'numeric' })}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                {s.game.awayAbbr} @ {s.game.homeAbbr}{story && <span style={{ color: t.muted }}> · {s.park.venue}</span>}
              </span>
            </li>
          ))}
          {it.stops.length > shown.length && <li style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>+ {it.stops.length - shown.length} more</li>}
        </ol>
      </div>
    </CardFrame>
  );
});

/** A viewBox framing the route, padded and expanded to match the container's aspect ratio. */
function tripView(it: Itinerary, home: [number, number] | undefined, aspect: number): [number, number, number, number] {
  const proj = createAlbersProjection();
  const pts = [...(home ? [home] : []), ...it.stops.map((s) => s.park.coordinates)]
    .map((p) => proj(p))
    .filter((p): p is [number, number] => p !== null);
  if (!pts.length) return FULL_VIEW;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  let w = Math.max(300, (Math.max(...xs) - Math.min(...xs)) * 1.5);
  let h = Math.max(300 / aspect, (Math.max(...ys) - Math.min(...ys)) * 1.5);
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}
