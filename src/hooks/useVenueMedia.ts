'use client';

import { useEffect, useState } from 'react';
import { fetchVenueSummary, getCachedVenueSummary, type VenueSummary } from '@/lib/api/wikipediaApi';

export function useVenueSummary(venue: string, enabled = true): VenueSummary | null {
  const [summary, setSummary] = useState<VenueSummary | null>(() => getCachedVenueSummary(venue) ?? null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    void fetchVenueSummary(venue).then((s) => {
      if (alive) setSummary(s);
    });
    return () => {
      alive = false;
    };
  }, [venue, enabled]);

  return summary;
}
