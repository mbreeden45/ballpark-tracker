import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import type { CardData, ShareFormat, ShareTheme } from '@/lib/shareTypes';
import { getPark } from '@/lib/parks';
import { formatDate } from '@/lib/utils';
import { CardFrame } from './CardFrame';
import { F } from './theme';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  data: CardData;
}

export const CheckInCard = forwardRef<HTMLDivElement, Props>(function CheckInCard({ format, theme, data }, ref) {
  const story = format === 'story';
  const park = data.parkId ? getPark(data.parkId) : undefined;
  const entry = park ? data.entries[park.id] : undefined;
  const eyebrow = `${data.stats.visited} OF 30 MLB BALLPARKS VISITED`;
  const details = [entry?.visit.dateVisited ? formatDate(entry.visit.dateVisited) : '', entry?.visit.finalScore].filter(Boolean).join('  ·  ');

  const bg = park ? `linear-gradient(155deg, ${park.primaryColor}, ${park.secondaryColor})` : 'linear-gradient(180deg, #0B2D5E, #041E42)';

  return (
    <CardFrame
      ref={ref}
      format={format}
      theme={theme}
      host={data.host}
      background={bg}
      onPhoto
      backdrop={
        <>
          {data.photo && <img src={data.photo} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,30,66,0.55) 0%, rgba(4,30,66,0) 28%, rgba(4,30,66,0) 45%, rgba(4,30,66,0.94) 100%)' }} />
        </>
      }
    >
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ background: '#fff', color: '#041E42', borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' }}>{eyebrow}</span>
        <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 999, background: '#12805C', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxSizing: 'border-box' }}>
          <Check size={20} strokeWidth={3.5} color="#fff" />
        </span>
      </div>
      <div style={{ flex: 1 }} />
      {park && (
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, textTransform: 'uppercase', lineHeight: 0.95, fontSize: story ? 48 : 34, textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>{park.venue}</div>
          <div style={{ marginTop: 6, fontSize: story ? 14 : 12, fontWeight: 600, opacity: 0.92 }}>
            {park.franchise} · {park.city}, {park.state}
          </div>
          {details && <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#fff', opacity: 0.85 }}>{details}</div>}
        </div>
      )}
    </CardFrame>
  );
});
