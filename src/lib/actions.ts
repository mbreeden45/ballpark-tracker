import { computeStats, type Stats } from './stats';
import { fireConfetti, hapticLight } from './feedback';
import { useBallparkStore } from '@/store/useBallparkStore';

/** Celebrates a completed division sweep (small burst) or the full 30/30 (big show). */
export function celebrateProgress(before: Stats, after: Stats): void {
  if (after.visited === after.total && before.visited < after.total) void fireConfetti(true);
  else if (after.sweeps > before.sweeps) void fireConfetti(false);
}

let lastCheckAt = 0;
const QUIET_MS = 20_000;

/** One-tap visited toggle used by the checklist, cards, and map popup. */
export function setVisited(id: string, visited: boolean): void {
  const store = useBallparkStore.getState();
  const before = computeStats(store.entries);
  store.setStatus(id, visited ? 'visited' : 'unvisited');
  const after = computeStats(useBallparkStore.getState().entries);
  hapticLight();
  if (!visited) return;
  celebrateProgress(before, after);

  const firstEver = before.visited === 0 && !store.hintSeen;
  if (firstEver) store.showHint(id);

  const now = Date.now();
  const quiet = now - lastCheckAt > QUIET_MS;
  lastCheckAt = now;

  if (after.visited === after.total) {
    store.setShareNudge({ message: 'All 30 ballparks. Complete game!', context: { card: 'milestone' } });
  } else if (after.sweeps > before.sweeps) {
    const d = after.divisions.find((x, i) => x.swept && !before.divisions[i].swept);
    store.setShareNudge({ message: `${d ? `${d.league} ${d.division}` : 'Division'} swept!`, context: { card: 'milestone' } });
  } else if ([10, 20].includes(after.visited)) {
    store.setShareNudge({ message: `${after.visited} ballparks and counting.`, context: { card: 'milestone' } });
  } else if (!firstEver && quiet) {
    store.setShareNudge({ message: `Park #${after.visited} is in the books.`, context: { card: 'checkin', parkId: id } });
  }
}
