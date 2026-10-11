'use client';

import { useEffect } from 'react';
import { Share2, X } from 'lucide-react';
import { useBallparkStore } from '@/store/useBallparkStore';

/** A quiet "share this?" prompt after a check-in or milestone. Auto-dismisses. */
export function ShareNudge() {
  const nudge = useBallparkStore((s) => s.shareNudge);
  const setNudge = useBallparkStore((s) => s.setShareNudge);
  const openShare = useBallparkStore((s) => s.openShare);
  const hintShowing = useBallparkStore((s) => s.hintParkId !== null);
  const drawerOpen = useBallparkStore((s) => s.drawerParkId !== null);
  const shareOpen = useBallparkStore((s) => s.shareContext !== null);

  useEffect(() => {
    if (!nudge) return;
    const t = window.setTimeout(() => setNudge(null), 9000);
    return () => window.clearTimeout(t);
  }, [nudge, setNudge]);

  if (!nudge || hintShowing || drawerOpen || shareOpen) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-30 mx-auto flex max-w-md animate-slideUp items-center gap-3 rounded-xl bg-white p-3 pl-4 shadow-pop ring-1 ring-line">
      <p className="min-w-0 flex-1 text-sm font-semibold text-navy">{nudge.message}</p>
      <button type="button" onClick={() => openShare(nudge.context)} className="btn-primary !min-h-[40px] !px-4">
        <Share2 size={16} /> Share
      </button>
      <button type="button" onClick={() => setNudge(null)} aria-label="Dismiss" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface">
        <X size={18} />
      </button>
    </div>
  );
}
