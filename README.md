# Ballpark Passport

A mobile-first MLB ballpark passport and survey app: stamp parks on a vintage atlas, rate the five tools, collect Wikipedia-illustrated trading cards, rank a tier list and share a 3x-resolution graphic.

- Next.js 15 (App Router) · TypeScript · Tailwind CSS · Zustand (persisted to localStorage)
- Map: react-simple-maps Albers atlas (includes southern Ontario)
- Share Studio: 8 auto-generated story cards (map poster, grid, big number, check-in with your own photo, milestone, challenge with QR, road trip, 3-slide set)
- Trip Planner at /planner reads your passport and the live MLB schedule
- Key-less APIs: MLB Stats API (schedule, box scores), Wikipedia REST (photos), Open-Meteo (elevation, forecast, city search), OSRM (road times)

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (type checks and lints)
```

Deploys to Vercel with no configuration or environment variables. Data lives in `data/ballparks.json` (regenerate with `node scripts/build-ballparks.mjs`).
