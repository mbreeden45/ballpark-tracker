'use client';

import { useEffect } from 'react';
import { Share2, Volume2, VolumeX } from 'lucide-react';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { BallparkMap } from '@/components/Map/BallparkMap';
import { ViewContainer } from '@/components/Views/ViewContainer';
import { FieldLogDrawer } from '@/components/Survey/FieldLogDrawer';
import { SocialShareModal } from '@/components/Share/SocialShareModal';
import { BaseballIcon } from '@/components/ui/BaseballIcon';

export function AppShell() {
  const stats = useStats();
  const soundEnabled = useBallparkStore((s) => s.soundEnabled);
  const setSoundEnabled = useBallparkStore((s) => s.setSoundEnabled);
  const setShareOpen = useBallparkStore((s) => s.setShareOpen);

  useEffect(() => {
    void useBallparkStore.persist.rehydrate();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b-4 border-double border-infield/40 bg-outfield text-cream shadow-card">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <BaseballIcon size={34} />
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg leading-none sm:text-xl">Ballpark Passport</h1>
              <p className="truncate font-typewriter text-[10px] uppercase tracking-[.2em] text-gold">
                {stats.visited}/30 stamped · AL {stats.al} · NL {stats.nl}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Mute bat crack sound' : 'Enable bat crack sound'}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button type="button" aria-label="Share passport" onClick={() => setShareOpen(true)} className="btn bg-gold !px-4 text-ballpark shadow-[0_3px_0_#B9851A] active:translate-y-[2px] active:shadow-none">
              <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-[repeating-linear-gradient(90deg,#C0362C_0_8px,transparent_8px_14px)] opacity-80" aria-hidden="true" />
      </header>

      <main className="mx-auto grid w-full max-w-[1400px] flex-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <BallparkMap className="h-[46dvh] min-h-[320px] lg:sticky lg:top-[72px] lg:h-[calc(100dvh-92px)]" />
        <div>
          <ViewContainer />
        </div>
      </main>

      <FieldLogDrawer />
      <SocialShareModal />
    </div>
  );
}
