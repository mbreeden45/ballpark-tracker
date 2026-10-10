'use client';

import { PARKS } from '@/lib/parks';
import { useBallparkStore } from '@/store/useBallparkStore';
import { formatDate } from '@/lib/utils';
import { emptyEntry, type Ballpark, type ParkEntry } from '@/lib/types';
import { StaticBalls } from '@/components/ui/BaseballRating';
import { averageRating } from '@/lib/utils';

function InkStamp({ park, date, tone }: { park: Ballpark; date: string; tone: string }) {
  const label = date ? formatDate(date, { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : 'UNDATED';
  const id = `arc-${park.id}`;
  return (
    <svg viewBox="0 0 120 120" className="ink-stamp h-24 w-24 animate-stamp opacity-90" aria-hidden="true">
      <defs>
        <path id={id} d="M 60 60 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0" />
      </defs>
      <circle cx="60" cy="60" r="55" fill="none" stroke={tone} strokeWidth="3" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={tone} strokeWidth="1" />
      <circle cx="60" cy="60" r="29" fill="none" stroke={tone} strokeWidth="1.5" strokeDasharray="3 3" />
      <text fontSize="9.5" fontWeight="700" fill={tone} letterSpacing="2" className="font-typewriter">
        <textPath href={`#${id}`} startOffset="0">{park.venue.toUpperCase().slice(0, 26)} ★ MLB ★</textPath>
      </text>
      <text x="60" y="58" textAnchor="middle" fontSize="19" fill={tone} className="font-display">{park.abbr}</text>
      <text x="60" y="74" textAnchor="middle" fontSize="7.5" fill={tone} letterSpacing="1" className="font-typewriter">{label}</text>
    </svg>
  );
}

function Stub({ park, entry, index }: { park: Ballpark; entry: ParkEntry; index: number }) {
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  const avg = averageRating(entry.ratings);
  const tones = ['#C0362C', '#1E4D2B', '#1E3A8A'];
  const v = entry.visit;
  return (
    <li className="relative pl-7">
      <span className="absolute left-0 top-6 h-4 w-4 rounded-full border-4 border-cream bg-seam shadow" aria-hidden="true" />
      <div className="ticket relative flex overflow-hidden rounded-lg bg-[#f6efdc] text-ballpark shadow-card" style={{ borderLeft: `8px solid ${park.primaryColor}` }}>
        <button type="button" onClick={() => openDrawer(park.id)} className="min-w-0 flex-1 p-3 pl-4 text-left" aria-label={`Edit ${park.venue} field log`}>
          <div className="font-typewriter text-[10px] uppercase tracking-[.2em] text-ballpark/60">
            {park.league} {park.division} · Admit One
          </div>
          <div className="font-display text-lg leading-tight">{park.venue}</div>
          <div className="text-xs text-ballpark/70">{park.franchise} · {park.city}, {park.state}</div>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-typewriter text-xs">
            <dt className="text-ballpark/50">Date</dt>
            <dd>{v.dateVisited ? formatDate(v.dateVisited, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</dd>
            <dt className="text-ballpark/50">Foe</dt>
            <dd className="truncate">{v.opponent || '—'}</dd>
            <dt className="text-ballpark/50">Final</dt>
            <dd>{v.finalScore || '—'}</dd>
            {(v.winningPitcher || v.losingPitcher) && (
              <>
                <dt className="text-ballpark/50">W / L</dt>
                <dd className="truncate">{v.winningPitcher || '—'} / {v.losingPitcher || '—'}</dd>
              </>
            )}
            {v.seatSection && (
              <>
                <dt className="text-ballpark/50">Seat</dt>
                <dd>Sec. {v.seatSection}</dd>
              </>
            )}
          </dl>
          <div className="mt-2 flex items-center gap-2">
            <StaticBalls value={avg} size={13} />
            {entry.tier && <span className="rounded bg-ballpark px-1.5 font-display text-xs text-gold">TIER {entry.tier}</span>}
          </div>
        </button>
        <div className="perforation my-2 shrink-0" aria-hidden="true" />
        <div className="flex w-[104px] shrink-0 items-center justify-center bg-cream/50 sm:w-[120px]">
          <InkStamp park={park} date={v.dateVisited} tone={tones[index % tones.length]} />
        </div>
      </div>
    </li>
  );
}

export function PassportView() {
  const entries = useBallparkStore((s) => s.entries);

  const visited = PARKS.filter((p) => entries[p.id]?.status === 'visited').sort((a, b) => {
    const da = entries[a.id]?.visit.dateVisited || '9999-99-99';
    const db = entries[b.id]?.visit.dateVisited || '9999-99-99';
    return da.localeCompare(db);
  });

  if (!visited.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-infield/40 bg-cream-dark/50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-dashed border-infield/40 font-display text-3xl text-infield/40">?</div>
        <p className="font-display text-lg text-infield">Your passport is blank</p>
        <p className="mt-1 font-typewriter text-sm text-ballpark/60">Log a ballpark and it gets its first ink stamp here, oldest visit first.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-4 left-[7px] top-4 w-0.5 bg-infield/25" aria-hidden="true" />
      <ol className="space-y-4">
        {visited.map((p, i) => (
          <Stub key={p.id} park={p} entry={entries[p.id] ?? emptyEntry()} index={i} />
        ))}
      </ol>
    </div>
  );
}
