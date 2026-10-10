import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#041E42', 700: '#0B2D5E', 600: '#123A74', 100: '#DCE5F2', 50: '#EEF3FA' },
        brand: { DEFAULT: '#BF0D3E', dark: '#9A0A32', 50: '#FCEAF0' },
        surface: { DEFAULT: '#F4F6F9', card: '#FFFFFF' },
        line: '#DDE3EB',
        muted: '#5B6777',
        silver: '#A2AAAD',
        ok: { DEFAULT: '#12805C', 50: '#E5F5EE' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(4,30,66,.06), 0 4px 14px -6px rgba(4,30,66,.18)',
        pop: '0 12px 32px -8px rgba(4,30,66,.35)',
      },
      keyframes: {
        tabIn: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pop: { '0%': { transform: 'scale(.6)' }, '60%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        tabIn: 'tabIn .25s ease-out both',
        pop: 'pop .28s ease-out both',
        slideUp: 'slideUp .3s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
