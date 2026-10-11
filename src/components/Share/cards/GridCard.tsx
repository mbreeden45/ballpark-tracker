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

export const GridCard = forwardRef<HTMLDivElement, Props>(function GridCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const t = TOKENS[theme];
  const { stats } = data;
  return (
    <CardFrame ref={ref} format={format} theme={theme} host={data.host}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: story ? 14 : 8 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.24em', fontWeight: 700, color: t.muted }}>MY BALLPARK PASSPORT</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: story ? 40 : 28, lineHeight: 1, textTransform: 'uppercase' }}>Parks Checked Off</div>
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 700, lineHeight: 0.9, fontSize: story ? 56 : 38 }}>
          {stats.visited}
          <span style={{ fontSize: story ? 24 : 17, color: t.muted }}>/30</span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GridBlock stats={stats} entries={data.entries} theme={theme} fontSize={story ? 18 : 15} />
      </div>
    </CardFrame>
  );
});
