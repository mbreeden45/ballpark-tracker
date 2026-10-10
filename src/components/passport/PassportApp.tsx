'use client';

import { Image as ImageIcon, ListChecks, ListOrdered, Map as MapIcon, Ticket } from 'lucide-react';
import { useBallparkStore } from '@/store/useBallparkStore';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { BallparkMap } from '@/components/Map/BallparkMap';
import { FieldLogDrawer } from '@/components/Survey/FieldLogDrawer';
import { SocialShareModal } from '@/components/Share/SocialShareModal';
import type { ListMode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ProgressHero } from './ProgressHero';
import { ChecklistView } from './ChecklistView';
import { CollectionView } from './CollectionView';
import { VisitsView } from './VisitsView';
import { RankingsView } from './RankingsView';
import { FirstLogHint } from './FirstLogHint';

const TABS: { mode: ListMode; label: string; icon: typeof ListChecks; mobileOnly?: boolean }[] = [
  { mode: 'checklist', label: 'Checklist', icon: ListChecks },
  { mode: 'map', label: 'Map', icon: MapIcon, mobileOnly: true },
  { mode: 'collection', label: 'Gallery', icon: ImageIcon },
  { mode: 'visits', label: 'My Visits', icon: Ticket },
  { mode: 'rankings', label: 'Rankings', icon: ListOrdered },
];

export function PassportApp() {
  const stored = useBallparkStore((s) => s.activeListMode);
  const setMode = useBallparkStore((s) => s.setActiveListMode);
  const desktop = useIsDesktop();
  const mode: ListMode = desktop && stored === 'map' ? 'checklist' : stored;
  const tabs = TABS.filter((t) => !(desktop && t.mobileOnly));

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-4">
      <ProgressHero />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        {desktop && <BallparkMap className="sticky top-[68px] h-[calc(100dvh-160px)] min-h-[480px]" />}
        <section aria-label="Collection views" className="min-w-0">
          <div role="tablist" aria-label="View" className="sticky top-[52px] z-20 -mx-4 mb-4 flex gap-1 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur lg:top-[52px]">
            {tabs.map(({ mode: m, label, icon: Icon }) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-[11px] font-semibold transition sm:flex-row sm:gap-1.5 sm:text-sm',
                  mode === m ? 'bg-navy text-white' : 'text-muted hover:bg-white',
                )}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
          <div key={mode} role="tabpanel" className="animate-tabIn pb-10">
            {mode === 'checklist' && <ChecklistView />}
            {mode === 'map' && <BallparkMap className="h-[calc(100dvh-230px)] min-h-[380px]" />}
            {mode === 'collection' && <CollectionView />}
            {mode === 'visits' && <VisitsView />}
            {mode === 'rankings' && <RankingsView />}
          </div>
        </section>
      </div>
      <FieldLogDrawer />
      <SocialShareModal />
      <FirstLogHint />
    </main>
  );
}
