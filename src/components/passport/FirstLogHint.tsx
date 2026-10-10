'use client';

import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { getPark } from '@/lib/parks';
import { useBallparkStore } from '@/store/useBallparkStore';

/** One-time prompt shown after the very first park is checked off. */
export function FirstLogHint() {
  const parkId = useBallparkStore((s) => s.hintParkId);
  const dismiss = useBallparkStore((s) => s.dismissHint);
  const openDrawer = useBallparkStore((s) => s.openDrawer);
  const park = parkId ? getPark(parkId) : undefined;

  useEffect(() => {
    if (!parkId) return;
    const t = window.setTimeout(dismiss, 14000);
    return () => window.clearTimeout(t);
  }, [parkId, dismiss]);

  if (!park) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 mx-auto max-w-md animate-slideUp rounded-xl bg-navy p-4 text-white shadow-pop">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ok"><Check size={15} strokeWidth={3} /></span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{park.venue} is in your passport.</p>
          <p className="mt-0.5 text-white/75">Want to add the date, score, ratings or notes? Tap any park and choose <b>Details</b> whenever you like.</p>
          <button
            type="button"
            onClick={() => {
              dismiss();
              openDrawer(park.id);
            }}
            className="mt-2 text-sm font-semibold underline"
          >
            Add details for {park.venue}
          </button>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
