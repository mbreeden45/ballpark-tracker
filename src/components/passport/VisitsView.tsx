'use client';

import { CalendarPlus, Pencil } from 'lucide-react';
import { PARKS } from '@/lib/parks';
import { useBallparkStore } from '@/store/useBallparkStore';
import { StaticBalls } from '@/components/ui/BaseballRating';
import { averageRating, formatDate } from '@/lib/utils';

export function VisitsView() {
  const entries = useBallparkStore((s) => s.entries);
  const openDrawer = useBallparkStore((s) => s.openDrawer);

  const visited = PARKS.filter((p) => entries[p.id]?.status === 'visited').sort((a, b) => {
    const da = entries[a.id]?.visit.dateVisited || '9999-99-99';
    const db = entries[b.id]?.visit.dateVisited || '9999-99-99';
    return da.localeCompare(db);
  });

  if (!visited.length) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl font-bold">No visits yet</p>
        <p className="mt-1 text-sm text-muted">Check off a ballpark in the Checklist and it will show up here.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {visited.map((p) => {
        const e = entries[p.id]!;
        const v = e.visit;
        const avg = averageRating(e.ratings);
        return (
          <li key={p.id} className="card flex overflow-hidden">
            <div className="w-1.5 shrink-0" style={{ background: p.primaryColor }} />
            <div className="min-w-0 flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-display text-xl font-bold leading-tight">{p.venue}</div>
                  <div className="text-xs text-muted">{p.franchise} · {p.city}, {p.state}</div>
                </div>
                {e.tier && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-display text-base font-bold text-white">{e.tier}</span>}
              </div>
              {v.dateVisited ? (
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="text-muted">Date</dt>
                  <dd className="font-medium">{formatDate(v.dateVisited, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</dd>
                  {v.opponent && (<><dt className="text-muted">Opponent</dt><dd>{v.opponent}</dd></>)}
                  {v.finalScore && (<><dt className="text-muted">Final</dt><dd className="font-medium">{v.finalScore}</dd></>)}
                  {(v.winningPitcher || v.losingPitcher) && (<><dt className="text-muted">W / L</dt><dd className="truncate">{v.winningPitcher || '—'} / {v.losingPitcher || '—'}</dd></>)}
                  {v.seatSection && (<><dt className="text-muted">Seat</dt><dd>{v.seatSection}</dd></>)}
                </dl>
              ) : (
                <button type="button" onClick={() => openDrawer(p.id)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                  <CalendarPlus size={16} /> Add the date to fill in the box score
                </button>
              )}
              <div className="mt-2 flex items-center justify-between">
                {avg > 0 ? <StaticBalls value={avg} size={15} /> : <span className="text-xs text-muted">Not rated yet</span>}
                <button type="button" onClick={() => openDrawer(p.id)} className="flex min-h-[40px] items-center gap-1 text-sm font-semibold text-navy">
                  <Pencil size={14} /> Edit
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
