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
  /** True once the one-time "add details" prompt has been shown. */
  hintSeen: boolean;
  /** Transient UI (not persisted) */
  hintParkId: string | null;
  drawerParkId: string | null;
  shareOpen: boolean;

  setStatus: (id: string, status: ParkStatus) => void;
  toggleWishlist: (id: string) => void;
  showHint: (parkId: string) => void;
  dismissHint: () => void;
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
      activeMapMode: 'atlas',
      activeListMode: 'checklist',
      soundEnabled: true,
      hintSeen: false,
      hintParkId: null,
      drawerParkId: null,
      shareOpen: false,

      setStatus: (id, status) =>
        set((s) => ({ entries: { ...s.entries, [id]: { ...(s.entries[id] ?? emptyEntry()), status } } })),
      toggleWishlist: (id) =>
        set((s) => {
          const cur = s.entries[id] ?? emptyEntry();
          if (cur.status === 'visited') return s;
          const status: ParkStatus = cur.status === 'wishlist' ? 'unvisited' : 'wishlist';
          return { entries: { ...s.entries, [id]: { ...cur, status } } };
        }),
      showHint: (hintParkId) => set({ hintParkId, hintSeen: true }),
      dismissHint: () => set({ hintParkId: null }),
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
      version: 2,
      migrate: (persisted) => {
        const old = (persisted ?? {}) as { entries?: Record<string, ParkEntry>; soundEnabled?: boolean };
        return { entries: old.entries ?? {}, soundEnabled: old.soundEnabled ?? true, activeMapMode: 'atlas', activeListMode: 'checklist', hintSeen: false };
      },
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        entries: s.entries,
        activeMapMode: s.activeMapMode,
        activeListMode: s.activeListMode,
        soundEnabled: s.soundEnabled,
        hintSeen: s.hintSeen,
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
