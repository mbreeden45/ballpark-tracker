'use client';

import { useEffect } from 'react';
import { useBallparkStore } from '@/store/useBallparkStore';

/** Loads persisted state after mount so server and first client render match. */
export function StoreHydrator() {
  useEffect(() => {
    void useBallparkStore.persist.rehydrate();
  }, []);
  return null;
}
