import { computeStats, type Stats } from './stats';
import { fireConfetti, hapticLight } from './feedback';
import { useBallparkStore } from '@/store/useBallparkStore';

/** Celebrates a completed division sweep (small burst) or the full 30/30 (big show). */
export function celebrateProgress(before: Stats, after: Stats): void {
  if (after.visited === after.total && before.visited < after.total) void fireConfetti(true);
  else if (after.sweeps > before.sweeps) void fireConfetti(false);
}

/** One-tap visited toggle used by the checklist, cards, and map popup. */
export function setVisited(id: string, visited: boolean): void {
  const store = useBallparkStore.getState();
  const before = computeStats(store.entries);
  store.setStatus(id, visited ? 'visited' : 'unvisited');
  const after = computeStats(useBallparkStore.getState().entries);
  hapticLight();
  if (!visited) return;
  celebrateProgress(before, after);
  if (before.visited === 0 && !store.hintSeen) store.showHint(id);
}
