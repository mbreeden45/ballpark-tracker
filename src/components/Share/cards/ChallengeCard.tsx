import { forwardRef } from 'react';
import type { CardData, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { CardFrame } from './CardFrame';
import { GridBlock } from './GridBlock';
import { F, TOKENS } from './theme';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const ChallengeCard = forwardRef<HTMLDivElement, Props>(function ChallengeCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const t = TOKENS[theme];
  const { stats } = data;
  const togo = stats.total - stats.visited;

  const qr = (size: number) =>
    data.qr ? (
      <div style={{ background: '#fff', padding: 5, borderRadius: 8, width: size, height: size, boxSizing: 'border-box', flexShrink: 0 }}>
        <img src={data.qr} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    ) : null;

  return (
    <CardFrame ref={ref} format={format} theme={theme} host={data.host}>
      <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 700, color: t.muted }}>BALLPARK CHALLENGE</div>
      <div style={{ fontFamily: F.display, fontWeight: 700, textTransform: 'uppercase', lineHeight: 0.92, fontSize: story ? 62 : 36, margin: story ? '6px 0 4px' : '2px 0' }}>
        {stats.visited} down.
        <br />
        <span style={{ color: t.accentText }}>{togo} to go.</span>
      </div>
      <div style={{ fontSize: story ? 15 : 12, fontWeight: 600, color: t.muted, marginBottom: story ? 14 : 6 }}>How many of the 30 have you hit?</div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GridBlock stats={stats} entries={data.entries} theme={theme} fontSize={story ? 17 : 13} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: story ? 14 : 8 }}>
        {qr(story ? 84 : 56)}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: story ? 22 : 16, textTransform: 'uppercase', lineHeight: 1 }}>Build your passport</div>
          <div style={{ fontSize: story ? 12 : 10, color: t.muted, fontWeight: 600, marginTop: 3 }}>Scan or visit {data.host}</div>
        </div>
      </div>
    </CardFrame>
  );
});
