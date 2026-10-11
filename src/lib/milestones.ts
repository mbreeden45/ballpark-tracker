import { getPark } from './parks';
import type { Stats } from './stats';
import type { Milestone } from './shareTypes';

/** The most share-worthy thing the user has achieved, or null when there is nothing notable yet. */
export function latestMilestone(stats: Stats, lastVisitedId: string | null): Milestone | null {
  if (stats.visited === stats.total) return { kind: 'complete' };

  const swept = stats.divisions.filter((d) => d.swept);
  if (swept.length) {
    const preferred = swept.find((d) => lastVisitedId && d.parkIds.includes(lastVisitedId)) ?? swept[swept.length - 1];
    return { kind: 'sweep', label: `${preferred.league} ${preferred.division}`, parkIds: preferred.parkIds };
  }

  const n = [20, 10].find((m) => stats.visited >= m);
  return n ? { kind: 'count', n } : null;
}

export function parkAbbr(id: string): string {
  return getPark(id)?.abbr ?? id.toUpperCase();
}
