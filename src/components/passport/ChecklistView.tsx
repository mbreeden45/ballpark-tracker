'use client';

import { useMemo, useState } from 'react';
import { Bookmark, ChevronRight, Search } from 'lucide-react';
import { PARKS } from '@/lib/parks';
import { setVisited } from '@/lib/actions';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { CheckButton } from '@/components/ui/CheckButton';
import { cn, formatDate } from '@/lib/utils';
import type { Ballpark, ParkEntry, ParkStatus } from '@/lib/types';

type Filter = 'all' | 'visited' | 'unvisited' | 'wishlist';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'visited', label: 'Visited' },
  { id: 'unvisited', label: 'Not yet' },
  { id: 'wishlist', label: 'Wishlist' },
];

function Row({ park, entry }: { park: Ballpark; entry: ParkEntry | undefined }) {
  const toggleWishlist = useBallparkStore((s) => s.toggleWishlist);
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  const status: ParkStatus = entry?.status ?? 'unvisited';
  const visited = status === 'visited';
  const meta = visited ? [entry?.visit.dateVisited ? formatDate(entry.visit.dateVisited) : '', entry?.visit.finalScore].filter(Boolean).join(' · ') : '';

  return (
    <li className="flex items-center gap-1 border-b border-line last:border-b-0">
      <div className="pl-3">
        <CheckButton checked={visited} onToggle={() => setVisited(park.id, !visited)} label={`${park.venue} visited`} size="lg" />
      </div>
      <button
        type="button"
        onClick={() => setVisited(park.id, !visited)}
        className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 py-2 text-left"
        aria-label={`${visited ? 'Unmark' : 'Mark'} ${park.venue} as visited`}
      >
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: park.primaryColor }} />
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-[15px] font-semibold leading-tight', visited && 'text-navy')}>{park.venue}</span>
          <span className="block truncate text-xs text-muted">
            {park.franchise} · {park.city}, {park.state}
          </span>
          {meta && <span className="block truncate text-xs font-medium text-ok">{meta}</span>}
        </span>
      </button>
      {!visited && (
        <button
          type="button"
          onClick={() => toggleWishlist(park.id)}
          aria-pressed={status === 'wishlist'}
          aria-label={`${status === 'wishlist' ? 'Remove from' : 'Add to'} wishlist: ${park.venue}`}
          className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', status === 'wishlist' ? 'text-brand' : 'text-silver hover:text-navy')}
        >
          <Bookmark size={20} fill={status === 'wishlist' ? 'currentColor' : 'none'} />
        </button>
      )}
      <button
        type="button"
        onClick={() => openDrawer(park.id)}
        aria-label={`Details for ${park.venue}`}
        className="flex h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-xs font-semibold text-muted hover:text-navy"
      >
        <span className="hidden sm:inline">Details</span>
        <ChevronRight size={18} />
      </button>
    </li>
  );
}

export function ChecklistView() {
  const entries = useBallparkStore((s) => s.entries);
  const stats = useStats();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      PARKS.filter((p) => {
        const status = entries[p.id]?.status ?? 'unvisited';
        if (filter !== 'all' && status !== filter) return false;
        if (!q) return true;
        return [p.venue, p.franchise, p.city, p.state, p.abbr].some((t) => t.toLowerCase().includes(q));
      }),
    [entries, filter, q],
  );

  return (
    <div>
      <p className="mb-3 text-sm text-muted">Tap a ballpark to check it off. You can add the date, rating and notes later.</p>
      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team, park or city"
          aria-label="Search ballparks"
          className="field-input !pl-10"
        />
      </div>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              'min-h-[38px] shrink-0 rounded-full border px-4 text-sm font-semibold transition',
              filter === f.id ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:text-navy',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="card p-8 text-center text-sm text-muted">No ballparks match.</p>}
      <div className="space-y-4">
        {stats.divisions.map((d) => {
          const parks = visible.filter((p) => d.parkIds.includes(p.id));
          if (!parks.length) return null;
          return (
            <section key={d.key} className="card overflow-hidden" aria-label={`${d.league} ${d.division}`}>
              <header className="flex items-center justify-between bg-surface px-3 py-2">
                <h3 className="h-display text-lg leading-none">
                  {d.league} {d.division}
                </h3>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', d.swept ? 'bg-brand text-white' : 'bg-white text-muted ring-1 ring-line')}>
                  {d.swept ? 'Division swept' : `${d.visited}/${d.total}`}
                </span>
              </header>
              <ul>
                {parks.map((p) => (
                  <Row key={p.id} park={p} entry={entries[p.id]} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
