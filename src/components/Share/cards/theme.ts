import type { ShareTheme } from '@/lib/shareTypes';

export interface Tokens {
  bg: string;
  fg: string;
  muted: string;
  land: string;
  stroke: string;
  context: string;
  panel: string;
  accent: string;
  /** Accent for text on the theme background. */
  accentText: string;
  tileOff: string;
  tileOffFg: string;
  pinOff: string;
  mapBg: string;
}

export const TOKENS: Record<ShareTheme, Tokens> = {
  dark: {
    bg: 'linear-gradient(180deg, #0B2D5E 0%, #041E42 100%)',
    fg: '#FFFFFF',
    muted: 'rgba(255,255,255,0.68)',
    land: '#133a73',
    stroke: '#2f5a99',
    context: '#0c2a58',
    panel: 'rgba(255,255,255,0.09)',
    accent: '#BF0D3E',
    accentText: '#FF5C7A',
    tileOff: 'rgba(255,255,255,0.08)',
    tileOffFg: 'rgba(255,255,255,0.38)',
    pinOff: 'rgba(255,255,255,0.4)',
    mapBg: 'transparent',
  },
  light: {
    bg: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FA 100%)',
    fg: '#041E42',
    muted: '#5B6777',
    land: '#FFFFFF',
    stroke: '#9AA8BA',
    context: '#E6EAF0',
    panel: 'rgba(4,30,66,0.06)',
    accent: '#BF0D3E',
    accentText: '#BF0D3E',
    tileOff: '#E3E8EF',
    tileOffFg: '#8B97A8',
    pinOff: '#B3BDCA',
    mapBg: '#E4EBF3',
  },
};

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or navy text, whichever reads better on the given background. */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.38 ? '#041E42' : '#FFFFFF';
}

/** A personal accent from the latest park, falling back to brand red when it would not show up. */
export function accentFor(parkColor: string | undefined, theme: ShareTheme): string {
  if (!parkColor) return TOKENS[theme].accent;
  const l = luminance(parkColor);
  if (theme === 'dark' && l < 0.06) return TOKENS[theme].accent;
  if (theme === 'light' && l > 0.6) return TOKENS[theme].accent;
  return parkColor;
}

export const F = {
  display: 'var(--font-display), "Arial Narrow", sans-serif',
  body: 'var(--font-body), system-ui, sans-serif',
};
