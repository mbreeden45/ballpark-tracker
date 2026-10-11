import { PARKS } from './parks';

/** Reads the visited bitmask used in share links (see buildShareUrl). */
export function parseVisitedMask(raw: string | undefined | null): Set<string> {
  const mask = raw && /^[0-9a-f]{1,8}$/i.test(raw) ? parseInt(raw, 16) >>> 0 : 0;
  const ids = new Set<string>();
  PARKS.forEach((p, i) => {
    if (mask & (1 << i)) ids.add(p.id);
  });
  return ids;
}
