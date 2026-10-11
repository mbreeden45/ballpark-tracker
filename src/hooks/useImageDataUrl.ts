'use client';

import { useEffect, useState } from 'react';

export interface ImageState {
  url: string | null;
  loading: boolean;
}

const cache = new Map<string, string | null>();

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches a remote image and converts it to a data URL so canvas export never taints or re-fetches it.
 * Resolves to null if the host blocks cross-origin reads.
 */
export function useImageDataUrl(src: string | null | undefined): ImageState {
  const [state, setState] = useState<ImageState>(() => ({
    url: src ? (cache.get(src) ?? null) : null,
    loading: Boolean(src && !cache.has(src)),
  }));

  useEffect(() => {
    if (!src) {
      setState({ url: null, loading: false });
      return;
    }
    if (cache.has(src)) {
      setState({ url: cache.get(src) ?? null, loading: false });
      return;
    }
    let alive = true;
    setState({ url: null, loading: true });
    void (async () => {
      try {
        const res = await fetch(src, { mode: 'cors' });
        if (!res.ok) throw new Error(String(res.status));
        const dataUrl = await blobToDataUrl(await res.blob());
        cache.set(src, dataUrl);
        if (alive) setState({ url: dataUrl, loading: false });
      } catch {
        cache.set(src, null);
        if (alive) setState({ url: null, loading: false });
      }
    })();
    return () => {
      alive = false;
    };
  }, [src]);

  return state;
}
