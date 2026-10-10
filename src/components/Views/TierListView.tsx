'use client';

import { useState } from 'react';
import { PARKS } from '@/lib/parks';
import { useBallparkStore } from '@/store/useBallparkStore';
import { TIERS, type Ballpark, type Tier } from '@/lib/types';
import { cn } from '@/lib/utils';

const TIER_STYLE: Record<Tier, string> = {
  S: 'bg-gold text-ballpark',
  A: 'bg-seam text-cream',
  B: 'bg-outfield text-cream',
  C: 'bg-infield text-cream',
  D: 'bg-ballpark text-cream',
};

function Chip({ park, selected, onSelect, onDragStart }: {
  park: Ballpark;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${park.venue}${selected ? ' (selected)' : ''}`}
      className={cn(
        'flex min-h-[44px] cursor-grab touch-manipulation items-center gap-1.5 rounded-md border-2 bg-cream px-2 text-left shadow-card transition active:cursor-grabbing',
        selected ? 'scale-105 border-gold ring-2 ring-gold' : 'border-ballpark/10',
      )}
      style={{ borderLeft: `6px solid ${park.primaryColor}` }}
    >
      <span className="font-scoreboard text-sm leading-none">{park.abbr}</span>
      <span className="max-w-[88px] truncate text-[10px] leading-tight text-ballpark/60">{park.venue}</span>
    </button>
  );
}

export function TierListView() {
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
      <p className="rounded-xl border-2 border-dashed border-ballpark/20 p-8 text-center font-typewriter text-sm text-ballpark/60">
        Visit a ballpark first — then drag it into a tier.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 font-typewriter text-xs text-ballpark/60">
        {selected ? 'Now tap a tier to place the selected park.' : 'Drag a park into a tier, or tap a park then tap a tier.'}
      </p>
      <div className="overflow-hidden rounded-xl border-2 border-ballpark shadow-card">
        {TIERS.map((tier) => {
          const parks = visited.filter((p) => entries[p.id]?.tier === tier);
          return (
            <div
              key={tier}
              {...dropProps(tier)}
              onClick={() => selected && place(selected, tier)}
              className={cn(
                'flex min-h-[64px] border-b-2 border-ballpark last:border-b-0 transition',
                hover === tier ? 'bg-gold/30' : 'bg-cream-dark/60',
                selected && 'cursor-pointer',
              )}
            >
              <div className={cn('flex w-14 shrink-0 items-center justify-center font-display text-3xl', TIER_STYLE[tier])}>{tier}</div>
              <div className="flex flex-1 flex-wrap content-center gap-1.5 p-2">{parks.map(chip)}</div>
            </div>
          );
        })}
      </div>

      <div
        {...dropProps('pool')}
        className={cn(
          'mt-4 rounded-xl border-2 border-dashed p-3 transition',
          hover === 'pool' ? 'border-gold bg-gold/20' : 'border-ballpark/25',
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-display text-sm uppercase tracking-wide text-ballpark/70">Dugout · Unranked ({unranked.length})</h4>
          {selected && entries[selected]?.tier && (
            <button type="button" onClick={() => place(selected, null)} className="text-xs font-bold uppercase text-seam underline">
              Unrank
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">{unranked.length ? unranked.map(chip) : <span className="text-xs text-ballpark/50">Every visited park is ranked.</span>}</div>
      </div>
    </div>
  );
}
