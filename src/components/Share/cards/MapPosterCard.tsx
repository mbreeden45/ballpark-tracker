import { forwardRef } from 'react';
import type { CardData, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { CardFrame } from './CardFrame';
import { MiniMap } from './MiniMap';
import { F, TOKENS, accentFor } from './theme';
import { getPark } from '@/lib/parks';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const MapPosterCard = forwardRef<HTMLDivElement, Props>(function MapPosterCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const t = TOKENS[theme];
  const { stats } = data;
  const last = data.lastVisitedId ? getPark(data.lastVisitedId) : undefined;
  const accent = accentFor(last?.primaryColor, theme);

  return (
    <CardFrame ref={ref} format={format} theme={theme} host={data.host}>
      <div style={{ display: 'flex', alignItems: story ? 'flex-start' : 'flex-end', justifyContent: 'space-between', flexDirection: story ? 'column' : 'row' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 700, color: t.muted }}>MY BALLPARK PASSPORT</div>
        <div style={{ fontFamily: F.display, fontWeight: 700, lineHeight: 0.9, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: story ? 118 : 64, color: t.fg }}>{stats.visited}</span>
          <span style={{ fontSize: story ? 44 : 26, color: t.muted }}>/ {stats.total}</span>
        </div>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0, margin: story ? '8px -10px 6px' : '4px -6px 4px', background: t.mapBg, borderRadius: story ? 0 : 8 }}>
        <MiniMap theme={theme} entries={data.entries} pinR={story ? 13 : 14} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, fontWeight: 700 }}>
        {[`AL ${stats.al}/${stats.alTotal}`, `NL ${stats.nl}/${stats.nlTotal}`, `${stats.sweeps}/6 DIVISIONS`].map((txt) => (
          <span key={txt} style={{ background: t.panel, color: t.fg, borderRadius: 999, padding: '4px 10px', letterSpacing: '0.04em' }}>
            {txt}
          </span>
        ))}
        {last && (
          <span style={{ background: accent, color: '#fff', borderRadius: 999, padding: '4px 10px' }}>Latest: {last.venue}</span>
        )}
      </div>
    </CardFrame>
  );
});
