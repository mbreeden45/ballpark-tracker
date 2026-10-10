'use client';

import { useState } from 'react';
import { PARKS } from '@/lib/parks';
import { useBallparkStore } from '@/store/useBallparkStore';
import { TIERS, type Ballpark, type Tier } from '@/lib/types';
import { cn } from '@/lib/utils';

const TIER_STYLE: Record<Tier, string> = {
  S: 'bg-brand text-white',
  A: 'bg-navy text-white',
  B: 'bg-navy-600 text-white',
  C: 'bg-silver text-navy',
  D: 'bg-line text-navy',
};

function Chip({ park, selected, onSelect, onDragStart }: { park: Ballpark; selected: boolean; onSelect: () => void; onDragStart: (e: React.DragEvent) => void }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-pressed={selected}
      aria-label={`${park.venue}${selected ? ' (selected)' : ''}`}
      className={cn(
        'flex min-h-[44px] cursor-grab touch-manipulation items-center gap-1.5 rounded-lg border bg-white px-2.5 text-left shadow-card active:cursor-grabbing',
        selected ? 'border-navy ring-2 ring-navy' : 'border-line',
      )}
      style={{ borderLeft: `5px solid ${park.primaryColor}` }}
    >
      <span className="font-display text-base font-bold leading-none">{park.abbr}</span>
      <span className="max-w-[90px] truncate text-[11px] leading-tight text-muted">{park.venue}</span>
    </button>
  );
}

export function RankingsView() {
  const entries = useBallparkStore((s) => s.entries);
  const setTier = useBallparkStore((s) => s.setTier);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<Tier | 'pool' | null>(null);

  const visited = PARKS.filter((p) => entries[p.id]?.status === 'visited');
  const unranked = visited.filter((p) => !entries[p.id]?.tier);

  const place = (id: string, tier: Tier | null) => {
    setTier(id, tier);
    setSelected(null);
    setHover(null);
  };

  const dropProps = (target: Tier | 'pool') => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setHover(target);
    },
    onDragLeave: () => setHover((h) => (h === target ? null : h)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id) place(id, target === 'pool' ? null : target);
    },
  });

  const chip = (p: Ballpark) => (
    <Chip
      key={p.id}
      park={p}
      selected={selected === p.id}
      onSelect={() => setSelected((cur) => (cur === p.id ? null : p.id))}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', p.id);
        e.dataTransfer.effectAllowed = 'move';
        setSelected(p.id);
      }}
    />
  );

  if (!visited.length) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl font-bold">Rankings unlock after your first visit</p>
        <p className="mt-1 text-sm text-muted">Check off a ballpark, then come back to sort your favorites into tiers.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted">{selected ? 'Now tap a tier to place the selected park.' : 'Drag a park into a tier, or tap a park and then a tier.'}</p>
      <div className="card overflow-hidden">
        {TIERS.map((tier) => (
          <div
            key={tier}
            {...dropProps(tier)}
            onClick={() => selected && place(selected, tier)}
            className={cn('flex min-h-[64px] border-b border-line last:border-b-0 transition', hover === tier ? 'bg-navy-50' : 'bg-white', selected && 'cursor-pointer')}
          >
            <div className={cn('flex w-14 shrink-0 items-center justify-center font-display text-3xl font-bold', TIER_STYLE[tier])}>{tier}</div>
            <div className="flex flex-1 flex-wrap content-center gap-1.5 p-2">{visited.filter((p) => entries[p.id]?.tier === tier).map(chip)}</div>
          </div>
        ))}
      </div>

      <div {...dropProps('pool')} className={cn('mt-4 rounded-xl border-2 border-dashed p-3 transition', hover === 'pool' ? 'border-navy bg-navy-50' : 'border-line')}>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="h-display text-base text-muted">Unranked ({unranked.length})</h4>
          {selected && entries[selected]?.tier && (
            <button type="button" onClick={() => place(selected, null)} className="text-xs font-semibold text-brand underline">
              Remove from tier
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">{unranked.length ? unranked.map(chip) : <span className="text-xs text-muted">Every visited park is ranked.</span>}</div>
      </div>
    </div>
  );
}
