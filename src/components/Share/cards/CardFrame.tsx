import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { CARD_SIZE, type ShareFormat, type ShareTheme } from '@/lib/shareTypes';
import { F, TOKENS } from './theme';

interface Props {
  format: ShareFormat;
  theme: ShareTheme;
  host: string;
  children: ReactNode;
  /** Replaces the themed background (used by the photo card). */
  background?: string;
  /** Force light text and footer regardless of theme (photo card). */
  onPhoto?: boolean;
  /** Extra footer content on the left (e.g. QR). */
  hideFooter?: boolean;
  /** Layer drawn behind everything, edge to edge (photo card). */
  backdrop?: ReactNode;
  style?: CSSProperties;
}

/**
 * Shared card shell. Story cards keep text out of the top and bottom bands that Instagram
 * and other apps cover with their own controls.
 */
export const CardFrame = forwardRef<HTMLDivElement, Props>(function CardFrame(
  { format, theme, host, children, background, onPhoto, hideFooter, backdrop, style },
  ref,
) {
  const { w, h } = CARD_SIZE[format];
  const story = format === 'story';
  const t = TOKENS[onPhoto ? 'dark' : theme];

  return (
    <div
      ref={ref}
      style={{
        width: w,
        height: h,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        background: background ?? t.bg,
        color: t.fg,
        fontFamily: F.body,
        padding: story ? '84px 22px 116px' : '18px 20px 14px',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {backdrop && <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>{backdrop}</div>}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
      {!hideFooter && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: story ? 10 : 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: story ? 10 : 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: t.muted,
            fontWeight: 600,
          }}
        >
          <span style={{ fontFamily: F.display, fontSize: story ? 13 : 12, letterSpacing: '0.1em', color: t.fg }}>Ballpark Passport</span>
          <span style={{ textTransform: 'none', letterSpacing: '0.02em' }}>Make yours: {host}</span>
        </div>
      )}
    </div>
  );
});
