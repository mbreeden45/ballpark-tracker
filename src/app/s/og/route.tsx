import { ImageResponse } from 'next/og';
import { PARKS } from '@/lib/parks';
import { parseVisitedMask } from '@/lib/shareMask';

export const dynamic = 'force-dynamic';

const DIVISIONS: { label: string; league: string; division: string }[] = ['AL', 'NL'].flatMap((league) =>
  ['East', 'Central', 'West'].map((division) => ({ label: `${league} ${division}`, league, division })),
);

function textOn(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#041E42' : '#FFFFFF';
}

export async function GET(req: Request) {
  const visited = parseVisitedMask(new URL(req.url).searchParams.get('v'));
  const count = visited.size;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #0B2D5E, #041E42)', color: '#fff', padding: 56, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 430 }}>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>MLB BALLPARK PASSPORT</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 230, fontWeight: 800, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: 80, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginLeft: 10 }}>/ 30</span>
            </div>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, marginTop: 6 }}>MLB ballparks visited</div>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#FF5C7A', fontWeight: 700 }}>How many have you hit?</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: 40, justifyContent: 'center' }}>
          {DIVISIONS.map((d) => (
            <div key={d.label} style={{ display: 'flex', flex: 1, marginBottom: 10 }}>
              {PARKS.filter((p) => p.league === d.league && p.division === d.division).map((p) => {
                const on = visited.has(p.id);
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      flex: 1,
                      marginRight: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      fontSize: 30,
                      fontWeight: 800,
                      background: on ? p.primaryColor : 'rgba(255,255,255,0.09)',
                      color: on ? textOn(p.primaryColor) : 'rgba(255,255,255,0.35)',
                      border: on ? '3px solid rgba(255,255,255,0.6)' : '3px solid transparent',
                    }}
                  >
                    {p.abbr}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
