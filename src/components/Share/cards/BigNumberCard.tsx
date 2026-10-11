import { forwardRef } from 'react';
import type { CardData, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { getPark } from '@/lib/parks';
import { rankTitle } from '@/lib/ranks';
import { CardFrame } from './CardFrame';
import { MiniMap } from './MiniMap';
import { F, TOKENS, accentFor } from './theme';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const BigNumberCard = forwardRef<HTMLDivElement, Props>(function BigNumberCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const t = TOKENS[theme];
  const { stats } = data;
  const last = data.lastVisitedId ? getPark(data.lastVisitedId) : undefined;
  const accent = accentFor(last?.primaryColor, theme);
  const size = story ? 200 : 150;
  const stroke = story ? 14 : 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = stats.visited / stats.total;

  return (
    <CardFrame ref={ref} format={format} theme={theme} host={data.host}>
      <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.24em', fontWeight: 700, color: t.muted }}>MY BALLPARK PASSPORT</div>
      <div style={{ flex: story ? 'none' : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: story ? '12px 0 8px' : '4px 0' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.panel} strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={accent}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circ * pct} ${circ}`}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, lineHeight: 0.9 }}>
            <span style={{ fontSize: story ? 88 : 66 }}>{stats.visited}</span>
            <span style={{ fontSize: story ? 20 : 16, color: t.muted, letterSpacing: '0.08em' }}>OF {stats.total} PARKS</span>
          </div>
        </div>
        {!story && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 700 }}>
            <span style={{ fontFamily: F.display, fontSize: 26, textTransform: 'uppercase', lineHeight: 1 }}>{rankTitle(stats.visited)}</span>
            <span style={{ color: t.muted }}>AL {stats.al}/{stats.alTotal}</span>
            <span style={{ color: t.muted }}>NL {stats.nl}/{stats.nlTotal}</span>
            <span style={{ color: t.muted }}>{stats.sweeps}/6 divisions</span>
          </div>
        )}
      </div>
      {story && (
        <>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'inline-block', background: accent, color: '#fff', fontFamily: F.display, fontWeight: 700, fontSize: 28, letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 999, padding: '4px 22px' }}>
              {rankTitle(stats.visited)}
            </span>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: t.muted, letterSpacing: '0.06em' }}>
              AL {stats.al}/{stats.alTotal} · NL {stats.nl}/{stats.nlTotal} · {stats.sweeps}/6 DIVISIONS
            </div>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 0, margin: '6px -10px 0', background: t.mapBg }}>
            <MiniMap theme={theme} entries={data.entries} pinR={13} />
          </div>
        </>
      )}
    </CardFrame>
  );
});
