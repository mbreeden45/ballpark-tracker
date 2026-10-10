'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { computeStats, type Stats } from '@/lib/stats';
import { emptyEntry, type ListMode, type MapMode, type ParkEntry, type ParkStatus, type Ratings, type Tier } from '@/lib/types';

export interface LogPayload {
  status: ParkStatus;
  visit: ParkEntry['visit'];
  ratings: Ratings;
  notes: ParkEntry['notes'];
  tier: Tier | null;
}

interface BallparkState {
  entries: Record<string, ParkEntry>;
  activeMapMode: MapMode;
  activeListMode: ListMode;
  soundEnabled: boolean;
  /** Transient UI (not persisted) */
  drawerParkId: string | null;
  shareOpen: boolean;

  setStatus: (id: string, status: ParkStatus) => void;
  saveLog: (id: string, payload: LogPayload) => void;
  setTier: (id: string, tier: Tier | null) => void;
  resetPark: (id: string) => void;
  setActiveMapMode: (mode: MapMode) => void;
  setActiveListMode: (mode: ListMode) => void;
  setSoundEnabled: (on: boolean) => void;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  setShareOpen: (open: boolean) => void;
}

export const useBallparkStore = create<BallparkState>()(
  persist(
    (set) => ({
      entries: {},
      activeMapMode: 'vintage',
      activeListMode: 'binder',
      soundEnabled: true,
      drawerParkId: null,
      shareOpen: false,

      setStatus: (id, status) =>
        set((s) => ({ entries: { ...s.entries, [id]: { ...(s.entries[id] ?? emptyEntry()), status } } })),
      saveLog: (id, payload) =>
        set((s) => ({ entries: { ...s.entries, [id]: { ...payload } } })),
      setTier: (id, tier) =>
        set((s) => ({ entries: { ...s.entries, [id]: { ...(s.entries[id] ?? emptyEntry()), tier } } })),
      resetPark: (id) =>
        set((s) => {
          const next = { ...s.entries };
          delete next[id];
          return { entries: next };
        }),
      setActiveMapMode: (activeMapMode) => set({ activeMapMode }),
      setActiveListMode: (activeListMode) => set({ activeListMode }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      openDrawer: (drawerParkId) => set({ drawerParkId }),
      closeDrawer: () => set({ drawerParkId: null }),
      setShareOpen: (shareOpen) => set({ shareOpen }),
    }),
    {
      name: 'ballpark-passport-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        entries: s.entries,
        activeMapMode: s.activeMapMode,
        activeListMode: s.activeListMode,
        soundEnabled: s.soundEnabled,
      }),
    },
  ),
);

export function useStats(): Stats {
  const entries = useBallparkStore((s) => s.entries);
  return useMemo(() => computeStats(entries), [entries]);
}

export function useEntry(id: string): ParkEntry {
  const entry = useBallparkStore((s) => s.entries[id]);
  return useMemo(() => entry ?? emptyEntry(), [entry]);
}
