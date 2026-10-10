'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Beer, Bookmark, CheckCircle2, ExternalLink, Loader2, Mountain, Utensils, Wheat, X } from 'lucide-react';
import { getPark } from '@/lib/parks';
import { computeStats } from '@/lib/stats';
import { fetchHomeGames, type GameResult } from '@/lib/api/mlbApi';
import { fetchElevationFeet } from '@/lib/api/elevationApi';
import { hapticTap, playBatCrack } from '@/lib/feedback';
import { celebrateProgress } from '@/lib/actions';
import { useVenueSummary } from '@/hooks/useVenueMedia';
import { useBallparkStore } from '@/store/useBallparkStore';
import { BaseballRating } from '@/components/ui/BaseballRating';
import { RATING_LABELS, TIERS, emptyEntry, type Ballpark, type ParkEntry, type ParkStatus, type Tier } from '@/lib/types';
import { cn, formatDate, todayISO } from '@/lib/utils';

type Lookup =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'none'; message: string }
  | { state: 'error' }
  | { state: 'applied'; game: GameResult }
  | { state: 'choose'; games: GameResult[] };

const STATUSES: { id: ParkStatus; label: string }[] = [
  { id: 'unvisited', label: 'Not yet' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'visited', label: 'Visited' },
];

function VenueHeader({ park }: { park: Ballpark }) {
  const summary = useVenueSummary(park.venue);
  const [feet, setFeet] = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchElevationFeet(park.coordinates[1], park.coordinates[0]).then((f) => alive && setFeet(f));
    return () => {
      alive = false;
    };
  }, [park]);

  return (
    <div>
      <div className="relative h-40 overflow-hidden rounded-xl" style={{ background: `linear-gradient(155deg, ${park.primaryColor}, ${park.secondaryColor})` }}>
        {summary?.photoUrl && !imgFailed && (
          <img src={summary.photoUrl} alt={`${park.venue} exterior`} onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
        <div className="absolute inset-x-3 bottom-2 text-white">
          <div className="font-display text-2xl font-bold leading-tight">{park.venue}</div>
          <div className="text-xs opacity-90">{park.franchise} · {park.city}, {park.state}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
        <span className="rounded-full bg-surface px-2.5 py-1">Opened {park.openedYear}</span>
        <span className="rounded-full bg-surface px-2.5 py-1">{park.capacity.toLocaleString()} seats</span>
        <span className="rounded-full bg-surface px-2.5 py-1">{park.turfType}</span>
        <span className="flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-white">
          <Mountain size={12} /> {feet === null ? '…' : `${feet.toLocaleString()} ft`}
        </span>
      </div>
      {summary?.extract && (
        <p className="mt-2 text-sm leading-snug text-muted">
          <span className="line-clamp-4">{summary.extract}</span>
          {summary.pageUrl && (
            <a href={summary.pageUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-ok underline">
              Wikipedia <ExternalLink size={11} />
            </a>
          )}
        </p>
      )}
      <p className="mt-2 rounded-lg border border-dashed border-brand bg-brand-50 px-3 py-2 text-sm">
        <b className="text-brand">Local classic:</b> {park.localClassicConcession}
      </p>
    </div>
  );
}

function LogForm({ park, onClose }: { park: Ballpark; onClose: () => void }) {
  const existing = useBallparkStore((s) => s.entries[park.id]);
  const soundEnabled = useBallparkStore((s) => s.soundEnabled);
  const saveLog = useBallparkStore((s) => s.saveLog);
  const resetPark = useBallparkStore((s) => s.resetPark);

  const [draft, setDraft] = useState<ParkEntry>(() => {
    const base = existing ?? emptyEntry();
    return { ...base, status: base.status === 'unvisited' ? 'visited' : base.status };
  });
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [saved, setSaved] = useState(false);
  const requestId = useRef(0);

  const setVisit = (patch: Partial<ParkEntry['visit']>) => setDraft((d) => ({ ...d, visit: { ...d.visit, ...patch } }));
  const setNotes = (patch: Partial<ParkEntry['notes']>) => setDraft((d) => ({ ...d, notes: { ...d.notes, ...patch } }));

  const applyGame = useCallback((game: GameResult) => {
    setDraft((d) => ({
      ...d,
      visit: {
        ...d.visit,
        opponent: game.opponent,
        finalScore: game.finalScore,
        winningPitcher: game.winningPitcher,
        losingPitcher: game.losingPitcher,
      },
    }));
    setLookup({ state: 'applied', game });
  }, []);

  const onDateChange = useCallback(
    async (date: string) => {
      setVisit({ dateVisited: date });
      const id = ++requestId.current;
      if (!date || date > todayISO()) {
        setLookup(date ? { state: 'none', message: 'That date is in the future — the box score will be waiting once the game is played.' } : { state: 'idle' });
        return;
      }
      setLookup({ state: 'loading' });
      try {
        const games = await fetchHomeGames(park.mlbId, date);
        if (id !== requestId.current) return;
        if (!games.length) {
          setLookup({ state: 'none', message: `No ${park.teamName} home game on ${formatDate(date)}. Enter the details by hand.` });
        } else if (games.length === 1) {
          if (games[0].isFinal) applyGame(games[0]);
          else {
            setVisit({ opponent: games[0].opponent });
            setLookup({ state: 'none', message: `Game status: ${games[0].status}. Opponent filled in; score unavailable.` });
          }
        } else {
          setLookup({ state: 'choose', games });
        }
      } catch {
        if (id === requestId.current) setLookup({ state: 'error' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [park, applyGame],
  );

  const save = () => {
    const before = computeStats(useBallparkStore.getState().entries);
    saveLog(park.id, draft);
    const after = computeStats(useBallparkStore.getState().entries);
    hapticTap();
    if (soundEnabled) playBatCrack();
    celebrateProgress(before, after);
    setSaved(true);
    window.setTimeout(onClose, 900);
  };

  return (
    <>
      <div className="scroll-y min-h-0 flex-1 space-y-6 px-4 pb-6 pt-1">
        <VenueHeader park={park} />

        <section aria-label="Status">
          <div className="flex gap-1 rounded-full bg-surface p-1" role="radiogroup" aria-label="Ballpark status">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={draft.status === s.id}
                onClick={() => setDraft((d) => ({ ...d, status: s.id }))}
                className={cn(
                  'flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition',
                  draft.status === s.id ? (s.id === 'visited' ? 'bg-ok text-white' : s.id === 'wishlist' ? 'bg-brand text-white' : 'bg-navy text-white') : 'text-muted',
                )}
              >
                {s.id === 'visited' && <CheckCircle2 size={14} />}
                {s.id === 'wishlist' && <Bookmark size={14} />}
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Game day" className="space-y-3">
          <h3 className="h-display text-xl text-navy">Game Day</h3>
          <label className="block">
            <span className="label">Date you attended</span>
            <input
              type="date"
              className="field-input"
              max={todayISO()}
              value={draft.visit.dateVisited}
              onChange={(e) => void onDateChange(e.target.value)}
            />
          </label>
          <div aria-live="polite" className="text-sm">
            {lookup.state === 'loading' && (
              <p className="flex items-center gap-2 text-muted"><Loader2 size={16} className="animate-spin" /> Checking the MLB box score…</p>
            )}
            {lookup.state === 'applied' && (
              <p className="rounded-lg bg-ok-50 px-3 py-2 text-ok">
                <b>Box score found:</b> {lookup.game.finalScore}
                {lookup.game.winningPitcher && <> · W: {lookup.game.winningPitcher}</>}
                {lookup.game.losingPitcher && <> · L: {lookup.game.losingPitcher}</>}
              </p>
            )}
            {lookup.state === 'none' && <p className="rounded-lg bg-surface px-3 py-2 text-navy">{lookup.message}</p>}
            {lookup.state === 'error' && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-brand">Couldn&apos;t reach the MLB Stats API. Enter the game details manually.</p>
            )}
            {lookup.state === 'choose' && (
              <div className="space-y-1.5">
                <p className="font-bold">Doubleheader — which game were you at?</p>
                {lookup.games.map((g) => (
                  <button key={g.gamePk} type="button" onClick={() => applyGame(g)} className="btn-ghost w-full !justify-start !normal-case">
                    Game {g.gameNumber}: vs {g.opponent} {g.isFinal && `· ${g.finalScore}`}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Opponent</span>
              <input className="field-input" value={draft.visit.opponent} onChange={(e) => setVisit({ opponent: e.target.value })} placeholder="Opponent" />
            </label>
            <label className="block">
              <span className="label">Final score</span>
              <input className="field-input" value={draft.visit.finalScore} onChange={(e) => setVisit({ finalScore: e.target.value })} placeholder="Away 3, Home 5" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Winning pitcher</span>
              <input className="field-input" value={draft.visit.winningPitcher} onChange={(e) => setVisit({ winningPitcher: e.target.value })} />
            </label>
            <label className="block">
              <span className="label">Losing pitcher</span>
              <input className="field-input" value={draft.visit.losingPitcher} onChange={(e) => setVisit({ losingPitcher: e.target.value })} />
            </label>
          </div>
          <label className="block">
            <span className="label">Seat section</span>
            <input className="field-input" value={draft.visit.seatSection} onChange={(e) => setVisit({ seatSection: e.target.value })} placeholder="e.g. 127, Row 14" />
          </label>
        </section>

        <section aria-label="Five tool ratings">
          <h3 className="h-display text-xl text-navy">The Five Tools</h3>
          <div className="divide-y divide-line">
            {RATING_LABELS.map(({ key, label, hint }) => (
              <BaseballRating
                key={key}
                label={label}
                hint={hint}
                value={draft.ratings[key]}
                onChange={(v) => setDraft((d) => ({ ...d, ratings: { ...d.ratings, [key]: v } }))}
              />
            ))}
          </div>
        </section>

        <section aria-label="Eats and drinks" className="space-y-3">
          <h3 className="h-display text-xl text-navy">Concourse Notes</h3>
          <label className="block">
            <span className="label flex items-center gap-1.5"><Utensils size={13} /> Standout food</span>
            <input className="field-input" value={draft.notes.standoutFood} onChange={(e) => setNotes({ standoutFood: e.target.value })} placeholder={park.localClassicConcession} />
          </label>
          {!draft.notes.standoutFood && (
            <button type="button" onClick={() => setNotes({ standoutFood: park.localClassicConcession })} className="-mt-1 text-xs font-bold text-ok underline">
              I had the {park.localClassicConcession}
            </button>
          )}
          <label className="block">
            <span className="label flex items-center gap-1.5"><Beer size={13} /> Craft beer taps</span>
            <textarea rows={2} className="field-input" value={draft.notes.craftBeerNotes} onChange={(e) => setNotes({ craftBeerNotes: e.target.value })} placeholder="Local breweries, best pour…" />
          </label>
          <label className="block">
            <span className="label flex items-center gap-1.5"><Wheat size={13} /> Gluten-free availability</span>
            <textarea rows={2} className="field-input" value={draft.notes.glutenFreeNotes} onChange={(e) => setNotes({ glutenFreeNotes: e.target.value })} placeholder="Stands, bun options, dedicated fryer…" />
          </label>
          <label className="block">
            <span className="label">Personal memory</span>
            <textarea rows={3} className="field-input" value={draft.notes.personalMemory} onChange={(e) => setNotes({ personalMemory: e.target.value })} placeholder="Who you went with, what you'll never forget…" />
          </label>
        </section>

        <section aria-label="Tier ranking">
          <h3 className="h-display text-xl text-navy">Tier Ranking</h3>
          <div className="mt-2 flex gap-1.5">
            {TIERS.map((t: Tier) => (
              <button
                key={t}
                type="button"
                aria-pressed={draft.tier === t}
                onClick={() => setDraft((d) => ({ ...d, tier: d.tier === t ? null : t }))}
                className={cn(
                  'flex h-12 flex-1 items-center justify-center rounded-lg border-2 font-display text-xl transition active:scale-95',
                  draft.tier === t ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Tiers apply to visited parks and show up in the Tier List and share graphic.</p>
        </section>

        {existing && (
          <button
            type="button"
            onClick={() => {
              resetPark(park.id);
              onClose();
            }}
            className="text-xs font-bold uppercase tracking-wide text-brand underline"
          >
            Erase this field log
          </button>
        )}
      </div>

      <div className="border-t border-line bg-white px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
        <button type="button" onClick={save} disabled={saved} className="btn-primary w-full">
          {saved ? 'Saved ✓' : draft.status === 'visited' ? 'Save Details' : draft.status === 'wishlist' ? 'Save to Wishlist' : 'Save'}
        </button>
      </div>
    </>
  );
}

export function FieldLogDrawer() {
  const parkId = useBallparkStore((s) => s.drawerParkId);
  const closeDrawer = useBallparkStore((s) => s.closeDrawer);
  const park = parkId ? getPark(parkId) : undefined;

  useEffect(() => {
    if (!parkId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [parkId, closeDrawer]);

  if (!park) return null;

  return (
    <aside
      role="dialog"
      aria-label={`${park.venue} field log`}
      className="sheet-enter fixed inset-x-0 bottom-0 z-40 flex max-h-[86dvh] flex-col overflow-hidden rounded-t-2xl border-t-4 border-brand bg-white shadow-[0_-12px_40px_rgba(30,32,34,.4)] lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-2xl lg:border-l-4 lg:border-t-0"
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <button type="button" onClick={closeDrawer} aria-label="Collapse field log" className="flex h-8 flex-1 items-start justify-center lg:hidden">
          <span className="mt-1 h-1.5 w-12 rounded-full bg-navy/25" />
        </button>
        <span className="hidden h-display text-base text-muted lg:block">Ballpark Details</span>
        <button type="button" onClick={closeDrawer} aria-label="Close field log" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface">
          <X size={22} />
        </button>
      </div>
      <LogForm key={park.id} park={park} onClose={closeDrawer} />
    </aside>
  );
}
