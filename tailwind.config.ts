import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FBF8F1', dark: '#F0E9D8', deep: '#E4DAC3' },
        outfield: { DEFAULT: '#1E4D2B', light: '#2D6B3F', dark: '#143520' },
        infield: { DEFAULT: '#8B4513', light: '#A9632D', dark: '#5E2F0D' },
        ballpark: { DEFAULT: '#1E2022', light: '#3A3E42' },
        seam: { DEFAULT: '#C0362C', dark: '#962A22' },
        gold: { DEFAULT: '#E5A823', dark: '#B9851A' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        typewriter: ['var(--font-typewriter)', 'Courier New', 'monospace'],
        scoreboard: ['var(--font-scoreboard)', 'Courier New', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,.7) inset, 0 6px 14px -6px rgba(30,32,34,.35), 0 1px 3px rgba(30,32,34,.25)',
        lift: '0 18px 30px -12px rgba(30,32,34,.5)',
      },
      keyframes: {
        flipIn: {
          '0%': { transform: 'rotateX(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        tabIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.8) rotate(-18deg)' },
          '100%': { opacity: '.9', transform: 'scale(1) rotate(-8deg)' },
        },
        glow: {
          '0%,100%': { opacity: '.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        flipIn: 'flipIn .45s cubic-bezier(.2,.8,.2,1) both',
        tabIn: 'tabIn .35s ease-out both',
        stamp: 'stamp .35s ease-out both',
        glow: 'glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
