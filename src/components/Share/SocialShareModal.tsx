'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toJpeg, toPng } from 'html-to-image';
import { Camera, ChevronLeft, ChevronRight, ClipboardCopy, Download, ImagePlus, Link2, MessageSquareText, RotateCcw, Share2, X } from 'lucide-react';
import { PARKS, getPark } from '@/lib/parks';
import { latestMilestone } from '@/lib/milestones';
import { buildCaption, buildShareUrl } from '@/lib/shareCaption';
import { CARD_SIZE, type CardData, type ShareCardId, type ShareFormat, type ShareTheme } from '@/lib/shareTypes';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { useVenueSummary } from '@/hooks/useVenueMedia';
import { useImageDataUrl } from '@/hooks/useImageDataUrl';
import { useQrDataUrl } from '@/hooks/useQrDataUrl';
import { cn } from '@/lib/utils';
import { ShareCard } from './cards/ShareCard';

const PIXEL_RATIO = 3;
const SET_CARDS: Exclude<ShareCardId, 'set'>[] = ['number', 'map', 'grid'];

const LABELS: Record<ShareCardId, string> = {
  map: 'Map Poster',
  grid: 'Passport Grid',
  number: 'Big Number',
  checkin: 'Check-In',
  milestone: 'Milestone',
  challenge: 'Challenge',
  trip: 'Road Trip',
  set: 'Story Set (3)',
};

function dataUrlToFile(dataUrl: string, name: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(meta)?.[1] ?? 'image/png';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

/** Reads a camera or library photo, honoring EXIF rotation, and shrinks it so exports stay fast. */
async function readPhoto(file: File): Promise<string> {
  const MAX = 1600;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}

export function SocialShareModal() {
  const context = useBallparkStore((s) => s.shareContext);
  const closeShare = useBallparkStore((s) => s.closeShare);
  if (!context) return null;
  return <ShareStudio key={JSON.stringify([context.card, context.parkId, context.trip?.itinerary.id])} onClose={closeShare} />;
}

function ShareStudio({ onClose }: { onClose: () => void }) {
  const context = useBallparkStore((s) => s.shareContext)!;
  const entries = useBallparkStore((s) => s.entries);
  const lastVisitedId = useBallparkStore((s) => s.lastVisitedId);
  const stats = useStats();

  const visitedParks = useMemo(() => PARKS.filter((p) => entries[p.id]?.status === 'visited'), [entries]);
  const milestone = useMemo(() => latestMilestone(stats, lastVisitedId), [stats, lastVisitedId]);

  const available = useMemo(() => {
    const list: ShareCardId[] = ['map', 'grid', 'number'];
    if (visitedParks.length) list.push('checkin');
    if (milestone) list.push('milestone');
    list.push('challenge');
    if (context.trip) list.unshift('trip');
    list.push('set');
    return list;
  }, [visitedParks.length, milestone, context.trip]);

  const initialCard: ShareCardId = context.card && available.includes(context.card) ? context.card : available[0];
  const [card, setCard] = useState<ShareCardId>(initialCard);
  const [format, setFormat] = useState<ShareFormat>('story');
  const [theme, setTheme] = useState<ShareTheme>('dark');
  const [parkId, setParkId] = useState<string | null>(context.parkId ?? lastVisitedId ?? visitedParks[0]?.id ?? null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [host, setHost] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setHost(window.location.host);
    setOrigin(window.location.origin);
  }, []);

  const park = parkId ? getPark(parkId) : undefined;
  const summary = useVenueSummary(park?.venue ?? '', Boolean(park));
  const wiki = useImageDataUrl(card === 'checkin' ? (summary?.photoUrl ?? null) : null);
  const qr = useQrDataUrl(origin);

  const data: CardData = useMemo(
    () => ({
      stats,
      entries,
      host,
      lastVisitedId,
      parkId,
      photo: userPhoto ?? wiki.url,
      qr,
      trip: context.trip ?? null,
      milestone,
    }),
    [stats, entries, host, lastVisitedId, parkId, userPhoto, wiki.url, qr, context.trip, milestone],
  );

  const isSet = card === 'set';
  const effectiveFormat: ShareFormat = isSet ? 'story' : format;
  const { w, h } = CARD_SIZE[effectiveFormat];
  const slots = isSet ? SET_CARDS : [card as Exclude<ShareCardId, 'set'>];
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  // Fit the preview to the available stage.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.7);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const totalW = slots.length * w + (slots.length - 1) * 12;
    const measure = () => setScale(Math.max(0.25, Math.min((stage.clientWidth - 8) / totalW, (stage.clientHeight - 8) / h, 1.4)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [slots.length, w, h]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = available.indexOf(card);
      setCard(available[(i + dir + available.length) % available.length]);
      setMessage('');
    },
    [available, card],
  );

  const touchX = useRef<number | null>(null);

  const waitingOnAssets = (card === 'challenge' && !qr) || (card === 'checkin' && wiki.loading && !userPhoto);

  const renderAll = useCallback(async (kind: 'png' | 'jpeg' = 'png'): Promise<string[]> => {
    if (document.fonts?.ready) await document.fonts.ready;
    const opts = { pixelRatio: PIXEL_RATIO, cacheBust: true, width: w, height: h, style: { transform: 'none', margin: '0' } };
    const out: string[] = [];
    for (let i = 0; i < slots.length; i++) {
      const node = nodes.current[i];
      if (!node) throw new Error('Card not mounted');
      const render = kind === 'jpeg' ? (n: HTMLElement) => toJpeg(n, { ...opts, quality: 0.95, backgroundColor: '#041E42' }) : (n: HTMLElement) => toPng(n, opts);
      await render(node); // warm-up pass: Safari drops fonts and SVG on the first render
      out.push(await render(node));
    }
    return out;
  }, [slots.length, w, h]);

  const baseName = `ballpark-passport-${card}`;
  const fileNames = (n: number, ext = 'png') => Array.from({ length: n }, (_, i) => (n > 1 ? `${baseName}-${i + 1}.${ext}` : `${baseName}-${format}.${ext}`));

  const download = (urls: string[]) => {
    const names = fileNames(urls.length);
    urls.forEach((u, i) => {
      window.setTimeout(() => {
        const a = document.createElement('a');
        a.href = u;
        a.download = names[i];
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 350);
    });
  };

  const shareUrl = useMemo(() => buildShareUrl(origin, entries), [origin, entries]);
  const caption = useMemo(() => buildCaption(card, data, shareUrl), [card, data, shareUrl]);

  /** Shares only the picture: a strict JPEG file, no title, text or URL, so iOS treats it as a photo. */
  const share = async () => {
    setBusy(true);
    setMessage('');
    try {
      const urls = await renderAll('jpeg');
      const names = fileNames(urls.length, 'jpg');
      const files = urls.map((u, i) => dataUrlToFile(u, names[i]));
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files })) {
        await navigator.share({ files });
      } else {
        download(await renderAll());
        setMessage('Saved as PNG.');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setMessage('Could not create the image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  /** Shares a link. Text and URL shares always list Messages, and iMessage turns the link into a preview card. */
  const shareLink = async () => {
    setMessage('');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'My MLB Ballpark Passport', text: caption.replace(shareUrl, '').trim(), url: shareUrl });
      } else {
        await navigator.clipboard.writeText(caption);
        setMessage('Caption and link copied.');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) setMessage('Could not open the share sheet. Try Copy caption.');
    }
  };

  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsHref = `sms:${isIos ? '&' : '?'}body=${encodeURIComponent(caption)}`;

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setMessage('Caption copied. Paste it into your post or message.');
    } catch {
      setMessage('Could not copy automatically. Long-press to copy: ' + caption);
    }
  };

  const save = async () => {
    setBusy(true);
    setMessage('');
    try {
      download(await renderAll());
      setMessage('Saved as PNG.');
    } catch {
      setMessage('Could not create the image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUserPhoto(await readPhoto(file));
      setMessage('');
    } catch {
      setMessage('That photo could not be read. Try another one.');
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Share your passport" className="fixed inset-0 z-50 flex flex-col bg-navy/95 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Share</h2>
        <button type="button" onClick={onClose} aria-label="Close share studio" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div role="tablist" aria-label="Share style" className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-2">
        {available.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={card === id}
            onClick={() => {
              setCard(id);
              setMessage('');
            }}
            className={cn('min-h-[38px] shrink-0 rounded-full px-4 text-sm font-semibold transition', card === id ? 'bg-white text-navy' : 'bg-white/10 text-white/80 hover:bg-white/20')}
          >
            {LABELS[id]}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-4 pb-2 text-xs font-semibold">
        {!isSet && (
          <div className="flex rounded-full bg-white/10 p-0.5">
            {(['story', 'square'] as const).map((f) => (
              <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={cn('min-h-[32px] rounded-full px-3', format === f ? 'bg-white text-navy' : 'text-white/80')}>
                {f === 'story' ? '9:16 Story' : '1:1 Square'}
              </button>
            ))}
          </div>
        )}
        {card !== 'checkin' && (
          <div className="flex rounded-full bg-white/10 p-0.5">
            {(['dark', 'light'] as const).map((th) => (
              <button key={th} type="button" aria-pressed={theme === th} onClick={() => setTheme(th)} className={cn('min-h-[32px] rounded-full px-3 capitalize', theme === th ? 'bg-white text-navy' : 'text-white/80')}>
                {th}
              </button>
            ))}
          </div>
        )}
      </div>

      {card === 'checkin' && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-4 pb-2 text-xs font-semibold">
          <label className="sr-only" htmlFor="checkin-park">Ballpark</label>
          <select id="checkin-park" value={parkId ?? ''} onChange={(e) => { setParkId(e.target.value); setUserPhoto(null); }} className="min-h-[36px] max-w-[190px] rounded-full bg-white/10 px-3 text-white">
            {visitedParks.map((p) => (
              <option key={p.id} value={p.id} className="text-navy">{p.venue}</option>
            ))}
          </select>
          <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-navy">
            <Camera size={15} /> Take photo
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-navy">
            <ImagePlus size={15} /> Choose photo
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {userPhoto && (
            <button type="button" onClick={() => setUserPhoto(null)} className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/10 px-3">
              <RotateCcw size={14} /> Stadium photo
            </button>
          )}
        </div>
      )}

      <div
        ref={stageRef}
        className="relative mx-auto flex min-h-0 w-full flex-1 items-center justify-center gap-2 overflow-hidden px-2"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
        }}
      >
        <button type="button" onClick={() => step(-1)} aria-label="Previous style" className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:flex">
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center justify-center" style={{ gap: 12 * scale }}>
          {slots.map((slot, i) => (
            <div key={`${slot}-${effectiveFormat}-${theme}`} style={{ width: w * scale, height: h * scale }} className="shrink-0 overflow-hidden rounded-lg shadow-pop">
              <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <ShareCard ref={(el) => { nodes.current[i] = el; }} card={slot} format={effectiveFormat} theme={theme} data={data} />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => step(1)} aria-label="Next style" className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:flex">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="mx-auto w-full max-w-sm shrink-0 space-y-2 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-2">
        {message && <p className="text-center text-sm text-white/90" aria-live="polite">{message}</p>}
        <a href={smsHref} className="btn-primary w-full">
          <MessageSquareText size={18} /> {card === 'trip' ? 'Text a friend the trip details' : 'Text a friend'}
        </a>
        <div className="flex gap-2">
          <button type="button" onClick={shareLink} className="btn flex-1 bg-white !px-2 text-navy hover:bg-navy-50">
            <Link2 size={16} /> Share link
          </button>
          <button type="button" onClick={share} disabled={busy || waitingOnAssets} className="btn flex-1 bg-white !px-2 text-navy hover:bg-navy-50">
            <Share2 size={16} /> {busy ? 'Rendering…' : waitingOnAssets ? 'Preparing…' : 'Share image'}
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copyCaption} className="btn-ghost flex-1 !border-white/30 !bg-transparent !px-2 !text-white">
            <ClipboardCopy size={16} /> Copy caption
          </button>
          <button type="button" onClick={save} disabled={busy || waitingOnAssets} className="btn-ghost flex-1 !border-white/30 !bg-transparent !px-2 !text-white">
            <Download size={16} /> {isSet ? 'Save 3 PNGs' : 'Save PNG'}
          </button>
        </div>
        <p className="text-center text-[11px] text-white/50">Texts and links show a preview card in Messages. Swipe the card for more styles.</p>
      </div>
    </div>
  );
}
