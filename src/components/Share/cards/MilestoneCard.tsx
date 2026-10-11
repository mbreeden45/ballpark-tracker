import { forwardRef } from 'react';
import { Trophy } from 'lucide-react';
import type { CardData, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { PARKS } from '@/lib/parks';
import { CardFrame } from './CardFrame';
import { MiniMap } from './MiniMap';
import { F, TOKENS, readableOn } from './theme';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const MilestoneCard = forwardRef<HTMLDivElement, Props>(function MilestoneCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const t = TOKENS[theme];
  const m = data.milestone ?? { kind: 'count' as const, n: data.stats.visited };

  const eyebrow = m.kind === 'sweep' ? 'DIVISION SWEPT' : m.kind === 'complete' ? 'COMPLETE GAME' : 'MILESTONE';
  const headline = m.kind === 'sweep' ? m.label : m.kind === 'complete' ? '30 for 30' : `${m.n} Parks`;
  const sub =
    m.kind === 'sweep' ? 'Every ballpark in the division, checked off.' : m.kind === 'complete' ? 'Every MLB ballpark. All of them.' : 'And the road trips are just getting started.';

  const sweep = m.kind === 'sweep';
  const showMap = !sweep;

  return (
    <CardFrame ref={ref} format={format} theme={theme} host={data.host}>
      <div style={{ flex: showMap ? 'none' : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ width: story ? 68 : 46, height: story ? 68 : 46, borderRadius: 999, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 ${story ? 8 : 5}px ${t.panel}` }}>
          <Trophy size={story ? 36 : 24} color="#fff" strokeWidth={2.2} />
        </span>
        <div style={{ marginTop: story ? 16 : 8, fontSize: 11, letterSpacing: '0.28em', fontWeight: 800, color: t.muted }}>{eyebrow}</div>
        <div style={{ fontFamily: F.display, fontWeight: 700, textTransform: 'uppercase', lineHeight: 0.92, fontSize: story ? 76 : 44 }}>{headline}</div>
        <div style={{ marginTop: 8, fontSize: story ? 14 : 11, color: t.muted, fontWeight: 600, maxWidth: 280 }}>{sub}</div>
        {m.kind === 'sweep' && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', width: '100%', margin: story ? '30px 0 26px' : '14px 0 10px' }}>
            {m.parkIds.map((id) => {
              const p = PARKS.find((x) => x.id === id)!;
              return (
                <div key={id} style={{ flex: 1, maxWidth: 64, aspectRatio: '1 / 1.2', borderRadius: 8, background: p.primaryColor, color: readableOn(p.primaryColor), boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 700, fontSize: story ? 22 : 15 }}>
                  {p.abbr}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showMap && (
        <div style={{ position: 'relative', flex: 1, minHeight: 0, margin: '10px -10px 0', background: t.mapBg }}>
          <MiniMap theme={theme} entries={data.entries} pinR={story ? 13 : 14} />
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 8, fontFamily: F.display, fontWeight: 700, fontSize: story ? 30 : 18, letterSpacing: '0.06em' }}>
        {data.stats.visited} / 30 BALLPARKS
      </div>
    </CardFrame>
  );
});
