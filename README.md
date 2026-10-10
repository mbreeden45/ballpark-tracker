# Ballpark Passport

A mobile-first MLB ballpark passport and survey app: stamp parks on a vintage atlas, rate the five tools, collect Wikipedia-illustrated trading cards, rank a tier list and share a 3x-resolution graphic.

- Next.js 15 (App Router) · TypeScript · Tailwind CSS · Zustand (persisted to localStorage)
- Maps: react-simple-maps (Albers projection incl. southern Ontario) and MapLibre GL with Esri World Imagery
- Key-less APIs: MLB Stats API (box score auto-fill), Wikipedia REST (photos and summaries), Open-Meteo (elevation)

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (type checks and lints)
```

Deploys to Vercel with no configuration or environment variables. Data lives in `data/ballparks.json` (regenerate with `node scripts/build-ballparks.mjs`).
