'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, X } from 'lucide-react';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { cn } from '@/lib/utils';
import { CARD_SIZE, ShareCard, type ShareFormat } from './ShareCards';

const PIXEL_RATIO = 3;

function dataUrlToFile(dataUrl: string, name: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(meta)?.[1] ?? 'image/png';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

export function SocialShareModal() {
  const open = useBallparkStore((s) => s.shareOpen);
  const setOpen = useBallparkStore((s) => s.setShareOpen);
  const entries = useBallparkStore((s) => s.entries);
  const stats = useStats();

  const [format, setFormat] = useState<ShareFormat>('story');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.7);

  const { w, h } = CARD_SIZE[format];

  useLayoutEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const availW = stage.clientWidth;
      const availH = stage.clientHeight;
      setScale(Math.max(0.3, Math.min(availW / w, availH / h, 1.4)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [open, w, h]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const render = useCallback(async (): Promise<string> => {
    const node = cardRef.current;
    if (!node) throw new Error('Share card not mounted');
    if (document.fonts?.ready) await document.fonts.ready;
    const options = { pixelRatio: PIXEL_RATIO, cacheBust: true, width: w, height: h, style: { transform: 'none', margin: '0' } };
    // First pass warms fonts/SVG in Safari; second pass is the real export.
    await toPng(node, options);
    return toPng(node, options);
  }, [w, h]);

  const filename = `ballpark-passport-${format === 'story' ? 'story' : 'tierlist'}.png`;

  const download = (dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const share = async () => {
    setBusy(true);
    setMessage('');
    try {
      const dataUrl = await render();
      const file = dataUrlToFile(dataUrl, filename);
      const payload = { files: [file], title: 'My Ballpark Passport', text: `${stats.visited}/30 MLB ballparks visited.` };
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share(payload);
      } else {
        download(dataUrl);
        setMessage('Saved as PNG.');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setMessage('Could not create the image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setMessage('');
    try {
      download(await render());
      setMessage('Saved as PNG.');
    } catch {
      setMessage('Could not create the image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Share your passport" className="fixed inset-0 z-50 flex flex-col bg-ballpark/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 text-cream">
        <h2 className="font-display text-lg">Share Studio</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close share studio" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-sm gap-1 rounded-full bg-white/10 p-1 text-cream">
        {([
          ['story', '9:16 Story'],
          ['square', '1:1 Tier List'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFormat(id)}
            aria-pressed={format === id}
            className={cn('min-h-[40px] flex-1 rounded-full text-xs font-bold uppercase tracking-wide transition', format === id ? 'bg-gold text-ballpark' : 'text-cream/80')}
          >
            {label}
          </button>
        ))}
      </div>

      <div ref={stageRef} className="relative mx-auto my-3 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-4">
        <div style={{ width: w * scale, height: h * scale }} className="shrink-0 overflow-hidden rounded-lg shadow-lift">
          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ShareCard ref={cardRef} format={format} stats={stats} entries={entries} />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-sm space-y-2 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        {message && <p className="text-center text-sm text-gold" aria-live="polite">{message}</p>}
        <button type="button" onClick={share} disabled={busy} className="btn-primary w-full">
          <Share2 size={18} /> {busy ? 'Rendering…' : 'Share Image'}
        </button>
        <button type="button" onClick={save} disabled={busy} className="btn-ghost w-full !border-cream/30 !bg-transparent !text-cream">
          <Download size={18} /> Save PNG
        </button>
      </div>
    </div>
  );
}
