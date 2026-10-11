'use client';

import { useEffect, useState } from 'react';

/** Generates a QR code (navy on white) for the given URL as a data URL. */
export function useQrDataUrl(text: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;
    let alive = true;
    void import('qrcode').then((QR) =>
      QR.toDataURL(text, { margin: 1, width: 300, errorCorrectionLevel: 'M', color: { dark: '#041E42', light: '#FFFFFF' } }).then((u) => {
        if (alive) setUrl(u);
      }),
    );
    return () => {
      alive = false;
    };
  }, [text]);

  return url;
}
