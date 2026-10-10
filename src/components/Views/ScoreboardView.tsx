'use client';

import { PARKS } from '@/lib/parks';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { statusOf } from '@/lib/stats';
import { cn } from '@/lib/utils';

function FlipDigit({ value }: { value: string }) {
  return (
    <span className="relative inline-block [perspective:400px]">
      <span
        key={value}
        className="relative flex h-10 w-7 animate-flipIn items-center justify-center overflow-hidden rounded-[3px] bg-ballpark font-scoreboard text-2xl text-cream shadow-[inset_0_-2px_0_rgba(0,0,0,.5)] [transform-origin:50%_0] sm:h-12 sm:w-9 sm:text-3xl"
      >
        {value}
        <span className="absolute inset-x-0 top-1/2 h-px bg-black/70" />
      </span>
    </span>
  );
}

function FlipNumber({ value, min = 1 }: { value: number; min?: number }) {
  const s = String(value).padStart(min, '0');
  return (
    <span className="inline-flex gap-1" aria-label={String(value)}>
      {s.split('').map((c, i) => (
        <FlipDigit key={i} value={c} />
      ))}
    </span>
  );
}

export function ScoreboardView() {
  const stats = useStats();
  const entries = useBallparkStore((s) => s.entries);
  const openDrawer = useBallparkStore((s) => s.openDrawer);

  return (
    <div className="scoreboard-panel rounded-xl border-[10px] border-[#0d2314] p-3 text-cream shadow-lift sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2 border-b-2 border-cream/30 pb-2">
        <h3 className="font-display text-base uppercase tracking-wider sm:text-lg">Out-of-Town Scoreboard</h3>
        <div className="flex items-center gap-1.5">
          <FlipNumber value={stats.visited} min={2} />
          <span className="font-scoreboard text-xl text-gold">/30</span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 font-scoreboard text-sm">
        {[
          { label: 'AL', v: stats.al, t: stats.alTotal },
          { label: 'NL', v: stats.nl, t: stats.nlTotal },
        ].map((l) => (
          <div key={l.label} className="flex items-center justify-between rounded bg-black/25 px-3 py-2">
            <span className="tracking-widest text-cream/80">{l.label} PARKS</span>
            <span className="text-gold">{l.v}/{l.t}</span>
          </div>
        ))}
      </div>

      <ul className="space-y-2">
        {stats.divisions.map((d) => (
          <li key={d.key} className="rounded-md bg-black/25 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-scoreboard text-sm tracking-widest sm:text-base">
                {d.league} {d.division.toUpperCase()}:
              </span>
              <span className="flex items-center gap-1.5">
                <FlipNumber value={d.visited} />
                <span className="font-scoreboard text-lg text-cream/70">/</span>
                <FlipNumber value={d.total} />
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {d.parkIds.map((id) => {
                  const park = PARKS.find((p) => p.id === id);
                  if (!park) return null;
                  const status = statusOf(entries, id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openDrawer(id)}
                      aria-label={`${park.venue}: ${status}`}
                      className={cn(
                        'min-h-[34px] min-w-[38px] rounded-sm border px-1 font-scoreboard text-xs transition active:scale-95',
                        status === 'visited' && 'border-gold bg-gold text-ballpark shadow-[0_0_8px_rgba(229,168,35,.6)]',
                        status === 'wishlist' && 'border-dashed border-cream/80 text-cream',
                        status === 'unvisited' && 'border-cream/20 text-cream/40',
                      )}
                    >
                      {park.abbr}
                    </button>
                  );
                })}
              </div>
              <span
                className={cn(
                  'shrink-0 font-scoreboard text-[11px] tracking-widest sm:text-xs',
                  d.swept ? 'animate-glow rounded bg-seam px-2 py-1 text-cream' : 'text-cream/60',
                )}
              >
                {d.swept ? 'SWEEPER' : `${d.total - d.visited} TO GO`}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center font-scoreboard text-[11px] tracking-widest text-cream/50">
        {stats.sweeps} OF 6 DIVISIONS SWEPT
      </p>
    </div>
  );
}
