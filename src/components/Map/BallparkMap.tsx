'use client';

import dynamic from 'next/dynamic';
import { Map as MapIcon, Route, Satellite } from 'lucide-react';
import { useBallparkStore } from '@/store/useBallparkStore';
import type { MapMode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { VintageAtlas } from './VintageAtlas';

const SatelliteMap = dynamic(() => import('./SatelliteMap').then((m) => m.SatelliteMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-ballpark font-typewriter text-sm text-cream">Loading satellite…</div>
  ),
});

const MODES: { mode: MapMode; label: string; short: string; icon: typeof MapIcon }[] = [
  { mode: 'vintage', label: 'Vintage Atlas', short: 'Atlas', icon: MapIcon },
  { mode: 'satellite', label: 'Satellite Dugout', short: 'Satellite', icon: Satellite },
  { mode: 'corridor', label: 'Roadtrip Corridors', short: 'Roadtrips', icon: Route },
];

export function BallparkMap({ className }: { className?: string }) {
  const mode = useBallparkStore((s) => s.activeMapMode);
  const setMode = useBallparkStore((s) => s.setActiveMapMode);

  return (
    <section className={cn('paper-card flex flex-col overflow-hidden', className)} aria-label="Ballpark map">
      <header className="flex items-center justify-between gap-2 border-b border-cream-deep bg-cream-dark/60 p-2">
        <div role="tablist" aria-label="Map mode" className="flex w-full gap-1 rounded-full bg-cream-deep/70 p-1">
          {MODES.map(({ mode: m, label, short, icon: Icon }) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-bold uppercase tracking-wide transition',
                mode === m ? 'bg-outfield text-cream shadow-card' : 'text-ballpark/70 hover:text-ballpark',
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </button>
          ))}
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        {mode === 'satellite' ? <SatelliteMap /> : <VintageAtlas key={mode} corridors={mode === 'corridor'} />}
      </div>
    </section>
  );
}
