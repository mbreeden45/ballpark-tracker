import { PARKS } from '@/lib/parks';
import type { Stats } from '@/lib/stats';
import type { ParkEntry } from '@/lib/types';
import type { ShareTheme } from '@/lib/shareTypes';
import { F, TOKENS, readableOn } from './theme';

interface Props {
  stats: Stats;
  entries: Record<string, ParkEntry | undefined>;
  theme: ShareTheme;
  /** Dim unvisited tiles more strongly (challenge card). */
  gap?: number;
  fontSize?: number;
}

/** 6 divisions by 5 teams. A fully lit row means a division sweep. */
export function GridBlock({ stats, entries, theme, gap = 4, fontSize = 17 }: Props) {
  const t = TOKENS[theme];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, height: '100%' }}>
      {stats.divisions.map((d) => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'stretch', gap, flex: 1, minHeight: 0 }}>
          <div
            style={{
              width: 26,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.display,
              fontSize: 11,
              lineHeight: 1.05,
              color: d.swept ? t.accentText : t.muted,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            <span>{d.league}</span>
            <span>{d.division.slice(0, 1)}</span>
          </div>
          {d.parkIds.map((id) => {
            const park = PARKS.find((p) => p.id === id)!;
            const on = entries[id]?.status === 'visited';
            return (
              <div
                key={id}
                style={{
                  flex: 1,
                  borderRadius: 5,
                  background: on ? park.primaryColor : t.tileOff,
                  color: on ? readableOn(park.primaryColor) : t.tileOffFg,
                  boxShadow: on ? 'inset 0 0 0 1.5px rgba(255,255,255,0.55)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F.display,
                  fontWeight: 700,
                  fontSize,
                  letterSpacing: '0.03em',
                }}
              >
                {park.abbr}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
