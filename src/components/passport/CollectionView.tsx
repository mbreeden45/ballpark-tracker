'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { PARKS } from '@/lib/parks';
import { setVisited } from '@/lib/actions';
import { useBallparkStore } from '@/store/useBallparkStore';
import { useVenueSummary } from '@/hooks/useVenueMedia';
import { useInView } from '@/hooks/useInView';
import { CheckButton } from '@/components/ui/CheckButton';
import { cn } from '@/lib/utils';
import type { Ballpark, ParkEntry } from '@/lib/types';

function Card({ park, entry }: { park: Ballpark; entry: ParkEntry | undefined }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const summary = useVenueSummary(park.venue, seen);
  const [failed, setFailed] = useState(false);
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  const visited = entry?.status === 'visited';

  return (
    <div ref={ref} className="card overflow-hidden">
      <div className="relative">
        <button
          type="button"
          onClick={() => openDrawer(park.id)}
          aria-label={`Open details for ${park.venue}`}
          className={cn('relative block aspect-[4/3] w-full overflow-hidden', !visited && 'grayscale')}
          style={{ background: `linear-gradient(135deg, ${park.primaryColor}, ${park.secondaryColor})` }}
        >
          {summary?.thumbUrl && !failed && (
            <img src={summary.thumbUrl} alt={`${park.venue} exterior`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
          )}
        </button>
        <div className="absolute right-2 top-2">
          <CheckButton checked={!!visited} onToggle={() => setVisited(park.id, !visited)} label={`${park.venue} visited`} size="md" className={cn(!visited && '!border-white !bg-white/90')} />
        </div>
        {entry?.status === 'wishlist' && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-brand shadow-card">
            <Bookmark size={12} fill="currentColor" /> Wishlist
          </span>
        )}
        {entry?.tier && <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">{entry.tier}</span>}
      </div>
      <div className="border-t-4 p-2.5" style={{ borderColor: park.primaryColor }}>
        <div className="truncate font-display text-lg font-bold leading-tight">{park.venue}</div>
        <div className="truncate text-xs text-muted">
          {park.teamName} · {park.city}
        </div>
      </div>
    </div>
  );
}

export function CollectionView() {
  const entries = useBallparkStore((s) => s.entries);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PARKS.map((p) => (
        <Card key={p.id} park={p} entry={entries[p.id]} />
      ))}
    </div>
  );
}
