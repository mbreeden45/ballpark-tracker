'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarSearch, ClipboardCheck, SlidersHorizontal } from 'lucide-react';
import { fetchHomeGames } from '@/lib/api/scheduleApi';
import { planTrips } from '@/lib/planner/engine';
import { buildTravel } from '@/lib/planner/travel';
import type { PlanResult } from '@/lib/planner/types';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { cn, todayISO } from '@/lib/utils';
import { PlannerForm, addDays, sampleWindow, type FormState } from './PlannerForm';
import { ItineraryView } from './ItineraryView';
import { SocialShareModal } from '@/components/Share/SocialShareModal';

const STORAGE_KEY = 'ballpark-planner-v1';
const MAX_RANGE_DAYS = 21;

function defaults(): FormState {
  const today = todayISO();
  return {
    startDate: today,
    endDate: addDays(today, 6),
    home: null,
    returnHome: true,
    preferredTeamIds: [],
    mustParkIds: [],
    includeVisited: false,
    maxDriveHours: 6,
    allowFlying: false,
    maxGames: 5,
  };
}

function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime()) / 86400000);
}

export function PlannerApp() {
  const entries = useBallparkStore((s) => s.entries);
  const stats = useStats();
  const [form, setForm] = useState<FormState>(defaults);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlanResult | null>(null);
  const [planned, setPlanned] = useState<FormState | null>(null);
  const [selected, setSelected] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const loaded = useRef(false);

  // Remember preferences (but not dates) between visits.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<FormState>;
        setForm((f) => ({ ...f, ...saved, startDate: f.startDate, endDate: f.endDate }));
      }
    } catch {
      /* ignore unreadable saved preferences */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      const { startDate: _s, endDate: _e, ...rest } = form;
      void _s;
      void _e;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      /* storage unavailable */
    }
  }, [form]);

  const visitedIds = useMemo(() => new Set(Object.entries(entries).filter(([, e]) => e?.status === 'visited').map(([id]) => id)), [entries]);
  const wishlistIds = useMemo(() => new Set(Object.entries(entries).filter(([, e]) => e?.status === 'wishlist').map(([id]) => id)), [entries]);

  const run = async () => {
    setError('');
    if (form.endDate < form.startDate) {
      setError('The end date must be on or after the start date.');
      return;
    }
    if (daysBetween(form.startDate, form.endDate) + 1 > MAX_RANGE_DAYS) {
      setError(`Please keep the trip window to ${MAX_RANGE_DAYS} days or fewer.`);
      return;
    }
    setBusy(true);
    try {
      const [games, travel] = await Promise.all([fetchHomeGames(form.startDate, form.endDate), buildTravel(form.home)]);
      const plan = planTrips(
        games,
        {
          ...form,
          visited: visitedIds,
          wishlist: wishlistIds,
        },
        travel,
      );
      setResult(plan);
      setPlanned(form);
      setSelected(0);
      setShowForm(false);
    } catch {
      setError('Could not load the MLB schedule. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const useSample = () => {
    const s = sampleWindow();
    setForm((f) => ({ ...f, startDate: s.startDate, endDate: s.endDate }));
    setResult(null);
    setShowForm(true);
  };

  const it = result?.itineraries[selected];

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-display text-4xl leading-none">Trip Planner</h1>
          <p className="mt-1 text-sm text-muted">Pick your dates and we&apos;ll find realistic game-to-game routes that hit the parks you still need.</p>
        </div>
        <Link href="/" className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
          <ClipboardCheck size={16} className="text-ok" />
          <span>
            <b>{stats.visited}/30</b> in your passport · planning around <b>{30 - stats.visited}</b> unvisited
            {stats.wishlist > 0 && <> · <b>{stats.wishlist}</b> wishlist</>}
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className={cn('btn-ghost mb-3 w-full lg:hidden', !result && 'hidden')}
            aria-expanded={showForm}
          >
            <SlidersHorizontal size={17} /> {showForm ? 'Hide trip settings' : 'Edit trip settings'}
          </button>
          <div className={cn(!showForm && 'hidden lg:block')}>
            <PlannerForm value={form} onChange={setForm} onSubmit={run} busy={busy} error={error} visitedIds={visitedIds} />
          </div>
        </div>

        <section aria-live="polite" aria-label="Trip results">
          {!result && !busy && (
            <div className="card p-8 text-center">
              <CalendarSearch size={36} className="mx-auto text-silver" />
              <p className="mt-2 font-display text-2xl font-bold">Your trips show up here</p>
              <p className="mt-1 text-sm text-muted">Set your dates and tap Plan my trip. We read the live MLB schedule, check real drive times, and favor parks you haven&apos;t visited.</p>
            </div>
          )}
          {busy && <div className="card p-8 text-center text-sm text-muted">Reading the schedule and checking drive times…</div>}

          {result && !busy && result.itineraries.length === 0 && (
            <div className="card p-8 text-center">
              <p className="font-display text-2xl font-bold">No workable trips found</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {result.gamesConsidered === 0
                  ? 'No regular-season home games are scheduled in that window. The regular season runs from late March through September, and the next schedule is usually published in late summer.'
                  : `We looked at ${result.gamesConsidered} home games but none fit your limits. Try more days, a longer drive limit, allowing flights, or including parks you've already visited.`}
              </p>
              <button type="button" onClick={useSample} className="btn-navy mt-4">Try a sample week</button>
            </div>
          )}

          {result && !busy && it && planned && (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Searched <b>{result.gamesConsidered}</b> home games · {result.roadDataUsed ? 'real road distances' : 'estimated distances (road service unavailable)'}
              </p>
              <div role="tablist" aria-label="Trip options" className="grid grid-cols-3 gap-2">
                {result.itineraries.map((o, i) => (
                  <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={selected === i}
                    onClick={() => setSelected(i)}
                    className={cn('rounded-xl border p-3 text-left transition', selected === i ? 'border-navy bg-navy text-white shadow-card' : 'border-line bg-white hover:border-navy/40')}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{o.tag}</div>
                    <div className="font-display text-2xl font-bold leading-tight">{o.newParks} new</div>
                    <div className="text-xs opacity-80">{o.stops.length} games · {o.totalMiles.toLocaleString()} mi</div>
                  </button>
                ))}
              </div>
              <ItineraryView key={it.id + planned.startDate} itinerary={it} home={planned.home} />
            </div>
          )}
        </section>
      </div>
      <SocialShareModal />
    </main>
  );
}
