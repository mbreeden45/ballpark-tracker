'use client';

import { useState } from 'react';
import { Bookmark, CheckCircle2, RotateCw } from 'lucide-react';
import { PARKS } from '@/lib/parks';
import { useBallparkStore } from '@/store/useBallparkStore';
import { useVenueSummary } from '@/hooks/useVenueMedia';
import { useInView } from '@/hooks/useInView';
import { StaticBalls } from '@/components/ui/BaseballRating';
import { averageRating, cn, formatDate } from '@/lib/utils';
import { emptyEntry, type Ballpark, type ParkEntry } from '@/lib/types';

type Filter = 'all' | 'visited' | 'wishlist' | 'unvisited';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All 30' },
  { id: 'visited', label: 'Visited' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'unvisited', label: 'To Go' },
];

function Card({ park, entry }: { park: Ballpark; entry: ParkEntry }) {
  const [flipped, setFlipped] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [ref, seen] = useInView<HTMLDivElement>();
  const summary = useVenueSummary(park.venue, seen);
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  const avg = averageRating(entry.ratings);
  const visited = entry.status === 'visited';

  const toggle = () => setFlipped((f) => !f);

  return (
    <div ref={ref} className="[perspective:1200px]">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${park.venue} card. Tap to flip.`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        className={cn(
          'preserve-3d relative aspect-[5/7] w-full cursor-pointer transition-transform duration-700 ease-[cubic-bezier(.3,.8,.3,1)]',
          flipped && 'rotate-y-180',
        )}
      >
        {/* FRONT */}
        <div
          className={cn(
            'backface-hidden absolute inset-0 flex flex-col overflow-hidden rounded-2xl p-2 shadow-lift',
            !visited && 'saturate-[.55]',
          )}
          style={{ background: `linear-gradient(155deg, ${park.primaryColor}, ${park.secondaryColor})` }}
        >
          <div className="flex items-center justify-between px-1 pb-1 text-cream">
            <span className="font-scoreboard text-xs tracking-widest">{park.abbr}</span>
            <span className="font-scoreboard text-[10px] opacity-80">EST. {park.openedYear}</span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border-2 border-cream/90 bg-ballpark/40">
            {summary?.thumbUrl && !imgFailed ? (
              <img src={summary.thumbUrl} alt={`${park.venue} exterior`} loading="lazy" onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl opacity-40">⚾</div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent" />
            <div className="absolute right-1.5 top-1.5">
              {visited && <CheckCircle2 size={22} className="rounded-full bg-cream text-outfield" />}
              {entry.status === 'wishlist' && <Bookmark size={22} className="rounded-full bg-cream p-0.5 text-seam" />}
            </div>
            {entry.tier && (
              <div className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold font-display text-sm text-ballpark shadow">
                {entry.tier}
              </div>
            )}
          </div>
          <div className="px-1 pb-0.5 pt-2 text-cream">
            <div className="font-display text-[15px] leading-tight [text-wrap:balance]">{park.venue}</div>
            <div className="mt-0.5 flex items-center justify-between text-[11px] opacity-90">
              <span className="truncate">{park.teamName}</span>
              <RotateCw size={12} className="shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col overflow-hidden rounded-2xl border-4 bg-cream p-2.5 text-ballpark shadow-lift" style={{ borderColor: park.primaryColor }}>
          <div className="flex items-baseline justify-between border-b-2 border-dashed border-ballpark/20 pb-1">
            <span className="font-display text-sm leading-tight">{park.abbr} · {park.city}</span>
            <span className="font-scoreboard text-[10px] text-ballpark/60">{park.league} {park.division.toUpperCase()}</span>
          </div>
          <div className="scroll-y mt-1.5 min-h-0 flex-1 space-y-1.5 text-[11px] leading-snug">
            {entry.status === 'visited' ? (
              <>
                <div className="flex items-center justify-between">
                  <StaticBalls value={avg} size={13} />
                  <span className="font-scoreboard">{avg ? avg.toFixed(1) : '—'}</span>
                </div>
                <div className="font-bold">{entry.visit.dateVisited ? formatDate(entry.visit.dateVisited) : 'Date not logged'}</div>
                {entry.visit.opponent && <div>vs {entry.visit.opponent}</div>}
                {entry.visit.finalScore && <div className="font-scoreboard text-xs">{entry.visit.finalScore}</div>}
                {entry.visit.seatSection && <div className="text-ballpark/70">Sec. {entry.visit.seatSection}</div>}
                {entry.notes.standoutFood && <div><b>Ate:</b> {entry.notes.standoutFood}</div>}
                {entry.notes.craftBeerNotes && <div><b>Sipped:</b> {entry.notes.craftBeerNotes}</div>}
                {entry.notes.personalMemory && <div className="font-typewriter italic text-ballpark/80">“{entry.notes.personalMemory}”</div>}
              </>
            ) : (
              <>
                <p className="text-ballpark/70">
                  {entry.status === 'wishlist' ? 'On your wishlist.' : 'Not visited yet.'} Capacity {park.capacity.toLocaleString()} · {park.turfType}.
                </p>
                <p><b>Must eat:</b> {park.localClassicConcession}</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openDrawer(park.id);
            }}
            className="btn-green mt-1.5 !min-h-[40px] !px-3 !text-xs"
          >
            {entry.status === 'visited' ? 'Edit Field Log' : 'Open Field Log'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BinderView() {
  const entries = useBallparkStore((s) => s.entries);
  const [filter, setFilter] = useState<Filter>('all');

  const parks = PARKS.filter((p) => {
    const status = entries[p.id]?.status ?? 'unvisited';
    return filter === 'all' || status === filter;
  });

  return (
    <div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'min-h-[38px] shrink-0 rounded-full border-2 px-4 text-xs font-bold uppercase tracking-wide transition',
              filter === f.id ? 'border-outfield bg-outfield text-cream' : 'border-ballpark/15 bg-cream text-ballpark/70',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {parks.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-ballpark/20 p-8 text-center font-typewriter text-sm text-ballpark/60">
          Nothing in this slot of the binder yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
          {parks.map((p) => (
            <Card key={p.id} park={p} entry={entries[p.id] ?? emptyEntry()} />
          ))}
        </div>
      )}
    </div>
  );
}
