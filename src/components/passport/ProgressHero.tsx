'use client';

import { Bookmark, Share2, Trophy } from 'lucide-react';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { cn } from '@/lib/utils';

function Bar({ value, total, className }: { value: number; total: number; className?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total}>
      <div className={cn('h-full rounded-full bg-white transition-all duration-500', className)} style={{ width: `${(value / total) * 100}%` }} />
    </div>
  );
}

export function ProgressHero() {
  const stats = useStats();
  const setShareOpen = useBallparkStore((s) => s.setShareOpen);

  return (
    <section className="overflow-hidden rounded-xl bg-navy text-white shadow-card" aria-label="Your progress">
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60">Ballparks visited</div>
          <div className="mt-1 flex items-baseline gap-1.5 font-display font-bold leading-none">
            <span className="text-6xl sm:text-7xl" aria-live="polite">{stats.visited}</span>
            <span className="text-3xl text-white/60 sm:text-4xl">/ {stats.total}</span>
          </div>
        </div>
        <button type="button" onClick={() => setShareOpen(true)} className="btn bg-white !px-4 text-navy hover:bg-navy-50" aria-label="Share my passport">
          <Share2 size={17} /> Share
        </button>
      </div>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <Bar value={stats.visited} total={stats.total} className="!bg-brand" />
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <div className="mb-1 flex justify-between font-semibold"><span>American League</span><span>{stats.al}/{stats.alTotal}</span></div>
            <Bar value={stats.al} total={stats.alTotal} />
          </div>
          <div>
            <div className="mb-1 flex justify-between font-semibold"><span>National League</span><span>{stats.nl}/{stats.nlTotal}</span></div>
            <Bar value={stats.nl} total={stats.nlTotal} />
          </div>
          <div className="flex items-center gap-2"><Trophy size={18} className="text-white/70" /><span><b>{stats.sweeps}</b>/6 divisions swept</span></div>
          <div className="flex items-center gap-2"><Bookmark size={18} className="text-white/70" /><span><b>{stats.wishlist}</b> on wishlist</span></div>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-navy-700 px-4 py-3 sm:px-5" aria-label="Achievements">
        {stats.badges.map((b) => (
          <div
            key={b.id}
            title={b.description}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
              b.earned ? 'bg-white text-navy' : 'border border-white/25 text-white/60',
            )}
          >
            <Trophy size={13} className={b.earned ? 'text-brand' : ''} />
            {b.name}
            {!b.earned && b.total > 1 && <span className="font-normal opacity-80">{b.have}/{b.total}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
