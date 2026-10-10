'use client';

import { BookOpen, LayoutGrid, ListOrdered, Ticket } from 'lucide-react';
import { useBallparkStore } from '@/store/useBallparkStore';
import type { ListMode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BinderView } from './BinderView';
import { PassportView } from './PassportView';
import { ScoreboardView } from './ScoreboardView';
import { TierListView } from './TierListView';

const TABS: { mode: ListMode; label: string; icon: typeof BookOpen }[] = [
  { mode: 'binder', label: 'Binder', icon: BookOpen },
  { mode: 'scoreboard', label: 'Scoreboard', icon: LayoutGrid },
  { mode: 'passport', label: 'Passport', icon: Ticket },
  { mode: 'tierlist', label: 'Tier List', icon: ListOrdered },
];

export function ViewContainer() {
  const mode = useBallparkStore((s) => s.activeListMode);
  const setMode = useBallparkStore((s) => s.setActiveListMode);

  return (
    <section aria-label="Collection views">
      <div role="tablist" aria-label="Collection view" className="sticky top-[57px] z-20 -mx-4 mb-4 flex gap-1 border-b border-cream-deep bg-cream/95 px-4 py-2 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-t-xl lg:px-2">
        {TABS.map(({ mode: m, label, icon: Icon }) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-bold uppercase tracking-wide transition sm:flex-row sm:gap-1.5 sm:text-xs',
              mode === m ? 'bg-ballpark text-gold shadow-card' : 'text-ballpark/60 hover:bg-cream-deep/60',
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <div key={mode} role="tabpanel" className="animate-tabIn pb-8">
        {mode === 'binder' && <BinderView />}
        {mode === 'scoreboard' && <ScoreboardView />}
        {mode === 'passport' && <PassportView />}
        {mode === 'tierlist' && <TierListView />}
      </div>
    </section>
  );
}
