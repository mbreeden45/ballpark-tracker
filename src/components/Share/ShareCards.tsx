import { forwardRef, useMemo } from 'react';
import { PARKS } from '@/lib/parks';
import { buildStaticPaths, createAlbersProjection } from '@/lib/geo';
import type { Stats } from '@/lib/stats';
import { TIERS, type ParkEntry, type Tier } from '@/lib/types';
import { averageRating } from '@/lib/utils';

export type ShareFormat = 'story' | 'square';

export const CARD_SIZE: Record<ShareFormat, { w: number; h: number }> = {
  story: { w: 360, h: 640 },
  square: { w: 360, h: 360 },
};

interface Props {
  format: ShareFormat;
  stats: Stats;
  entries: Record<string, ParkEntry | undefined>;
}

const TIER_COLORS: Record<Tier, string> = { S: '#BF0D3E', A: '#FFFFFF', B: '#7f93b2', C: '#A2AAAD', D: '#3d5a8a' };

function MiniMap({ entries, height }: { entries: Props['entries']; height: number }) {
  const { projection, paths } = useMemo(() => {
    const projection = createAlbersProjection();
    return { projection, paths: buildStaticPaths(projection) };
  }, []);
  return (
    <svg viewBox="55 35 830 540" width="100%" height={height} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {paths.context.map((d, i) => (
        <path key={`c${i}`} d={d} fill="#E6EAF0" stroke="#041E42" strokeWidth={0.6} />
      ))}
      {paths.states.map((d, i) => (
        <path key={`s${i}`} d={d} fill="#FFFFFF" stroke="#9aa8ba" strokeWidth={0.9} />
      ))}
      {PARKS.map((p) => {
        const xy = projection(p.coordinates);
        if (!xy) return null;
        const status = entries[p.id]?.status ?? 'unvisited';
        if (status === 'visited') {
          return (
            <g key={p.id} transform={`translate(${xy[0]} ${xy[1]}) rotate(45)`}>
              <rect x={-11} y={-11} width={22} height={22} fill="#041E42" />
              <rect x={-8} y={-8} width={16} height={16} fill="#FFFFFF" />
              <rect x={-4} y={-4} width={8} height={8} fill={p.primaryColor} />
            </g>
          );
        }
        return <circle key={p.id} cx={xy[0]} cy={xy[1]} r={status === 'wishlist' ? 6 : 4.5} fill={status === 'wishlist' ? '#FFFFFF' : '#8d8676'} stroke={status === 'wishlist' ? '#BF0D3E' : 'none'} strokeWidth={2.5} strokeDasharray={status === 'wishlist' ? '4 3' : undefined} />;
      })}
    </svg>
  );
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ format, stats, entries }, ref) {
  const { w, h } = CARD_SIZE[format];
  const story = format === 'story';

  const top3 = PARKS.filter((p) => entries[p.id]?.status === 'visited')
    .map((p) => ({ park: p, score: averageRating(entries[p.id]!.ratings), tier: entries[p.id]!.tier }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const badges = stats.earnedBadges.slice(0, story ? 8 : 5);

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 9, letterSpacing: '.28em', color: '#FFFFFF' }}>MY BALLPARK PASSPORT</div>
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: story ? 28 : 22, lineHeight: 1, color: '#FFFFFF' }}>BALLPARKS VISITED</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: story ? 40 : 30, lineHeight: 1, color: '#FFFFFF' }}>
          {stats.visited}<span style={{ fontSize: story ? 20 : 15, color: '#FFFFFF' }}>/30</span>
        </div>
      </div>
    </div>
  );

  const chips = (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, fontFamily: 'var(--font-display), sans-serif', fontSize: 10, color: '#041E42' }}>
      {[`AL ${stats.al}/${stats.alTotal}`, `NL ${stats.nl}/${stats.nlTotal}`, `SWEEPS ${stats.sweeps}/6`, `${stats.earnedBadges.length} BADGES`].map((t) => (
        <span key={t} style={{ background: '#FFFFFF', borderRadius: 3, padding: '3px 6px', whiteSpace: 'nowrap' }}>{t}</span>
      ))}
    </div>
  );

  const topList = (
    <div>
      <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 9, letterSpacing: '.22em', color: '#FFFFFF', marginBottom: 4 }}>TOP PARKS</div>
      {top3.length === 0 ? (
        <div style={{ fontSize: 10, color: '#FFFFFF', opacity: 0.7 }}>Rate a park to rank it here.</div>
      ) : (
        top3.map((r, i) => (
          <div key={r.park.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: story ? 6 : 3, color: '#FFFFFF' }}>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: story ? 22 : 16, color: '#FFFFFF', width: story ? 22 : 16 }}>{i + 1}</span>
            <span style={{ width: 5, alignSelf: 'stretch', background: r.park.primaryColor, borderRadius: 2, boxShadow: '0 0 0 1px #FFFFFF' }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: story ? 13 : 11, fontWeight: 700, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.park.venue}</div>
              <div style={{ fontSize: 9, opacity: 0.75 }}>{r.park.teamName}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: story ? 13 : 11, color: '#FFFFFF' }}>{r.score.toFixed(1)}</span>
          </div>
        ))
      )}
    </div>
  );

  const badgeRow = (
    <div>
      <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 9, letterSpacing: '.22em', color: '#FFFFFF', marginBottom: 4 }}>BADGES UNLOCKED</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {badges.length ? (
          badges.map((b) => (
            <span key={b.id} style={{ border: '1px solid #FFFFFF', color: '#FFFFFF', borderRadius: 999, padding: '2px 7px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
              ★ {b.name}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 10, color: '#FFFFFF', opacity: 0.7 }}>First badge is one ballpark away.</span>
        )}
      </div>
    </div>
  );

  const tierRows = (
    <div style={{ border: '1.5px solid #FFFFFF', borderRadius: 4, overflow: 'hidden' }}>
      {TIERS.map((t) => {
        const parks = PARKS.filter((p) => entries[p.id]?.status === 'visited' && entries[p.id]?.tier === t);
        return (
          <div key={t} style={{ display: 'flex', alignItems: 'stretch', minHeight: 22, borderBottom: t === 'D' ? 'none' : '1px solid rgba(251,248,241,.5)', background: 'rgba(0,0,0,.18)' }}>
            <div style={{ width: 22, background: TIER_COLORS[t], color: t === 'S' || t === 'B' || t === 'D' ? '#FFFFFF' : '#041E42', fontFamily: 'var(--font-display), sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: 2, alignContent: 'center' }}>
              {parks.map((p) => (
                <span key={p.id} style={{ background: p.primaryColor, color: '#fff', border: '1px solid #FFFFFF', borderRadius: 2, padding: '0 4px', fontFamily: 'var(--font-display), sans-serif', fontSize: 9, lineHeight: '14px' }}>{p.abbr}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding: story ? 20 : 14,
        background: 'linear-gradient(180deg, #0B2D5E 0%, #041E42 100%)',
        color: '#FFFFFF',
        fontFamily: 'var(--font-body), system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: story ? 14 : 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', inset: 6, border: '1.5px dashed rgba(229,168,35,.6)', borderRadius: 8, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        {header}
        {chips}
      </div>

      {story ? (
        <>
          <div style={{ background: '#041E42', border: '1.5px solid #FFFFFF', borderRadius: 8, padding: 6, flexShrink: 0 }}>
            <MiniMap entries={entries} height={230} />
          </div>
          <div style={{ flexShrink: 0 }}>{topList}</div>
          <div style={{ flexShrink: 0 }}>{tierRows}</div>
          <div style={{ flexShrink: 0 }}>{badgeRow}</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 150, flexShrink: 0, background: '#041E42', border: '1.5px solid #FFFFFF', borderRadius: 6, padding: 3 }}>
              <MiniMap entries={entries} height={96} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>{topList}</div>
          </div>
          <div style={{ flexShrink: 0 }}>{tierRows}</div>
          <div style={{ flexShrink: 0 }}>{badgeRow}</div>
        </>
      )}

      <div style={{ marginTop: 'auto', fontFamily: 'var(--font-body), sans-serif', fontSize: 8, letterSpacing: '.2em', textAlign: 'center', opacity: 0.6 }}>
        {story ? 'TRACK EVERY BALLPARK · ' : ''}BALLPARK PASSPORT
      </div>
    </div>
  );
});
