'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarSearch, ClipboardCheck, SlidersHorizontal } from 'lucide-react';
import { fetchHomeGames } from '@/lib/api/scheduleApi';
import { planHub, planTrips } from '@/lib/planner/engine';
import { buildTravel } from '@/lib/planner/travel';
import type { PlanResult } from '@/lib/planner/types';
import { useBallparkStore, useStats } from '@/store/useBallparkStore';
import { cn, formatDate, todayISO } from '@/lib/utils';
import { PlannerForm, addDays, sampleWindow, seasonWindow, type FormState } from './PlannerForm';
import { ItineraryView } from './ItineraryView';
import { SocialShareModal } from '@/components/Share/SocialShareModal';

const STORAGE_KEY = 'ballpark-planner-v1';
const MAX_RANGE_DAYS = 21;
const MAX_WINDOW_DAYS = 210;

function defaults(): FormState {
  const today = todayISO();
  const season = seasonWindow();
  return {
    mode: 'dates',
    startDate: today,
    endDate: addDays(today, 6),
    windowStart: season.startDate,
    windowEnd: season.endDate,
    tripDays: 7,
    teamId: null,
    teamOnly: true,
    home: null,
    base: null,
    roundTrip: true,
    stay: true,
    preferredTeamIds: [],
    mustParkIds: [],
    includeVisited: false,
    maxDriveHours: 6,
    allowFlying: false,
    maxGames: 5,
  };
}

function rangeLabel(it: PlanResult['itineraries'][number]): string {
  const first = it.stops[0].game.date;
  const last = it.stops[it.stops.length - 1].game.date;
  const fmt = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });
  return first === last ? fmt(first) : `${fmt(first)} – ${fmt(last)}`;
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
        setForm((f) => ({ ...f, ...saved, startDate: f.startDate, endDate: f.endDate, windowStart: f.windowStart, windowEnd: f.windowEnd }));
      }
    } catch {
      /* ignore unreadable saved preferences */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      const { startDate, endDate, windowStart, windowEnd, ...rest } = form;
      void startDate;
      void endDate;
      void windowStart;
      void windowEnd;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      /* storage unavailable */
    }
  }, [form]);

  const visitedIds = useMemo(() => new Set(Object.entries(entries).filter(([, e]) => e?.status === 'visited').map(([id]) => id)), [entries]);
  const wishlistIds = useMemo(() => new Set(Object.entries(entries).filter(([, e]) => e?.status === 'wishlist').map(([id]) => id)), [entries]);

  const run = async () => {
    setError('');
    const team = form.mode === 'team';
    const [from, to] = team ? [form.windowStart, form.windowEnd] : [form.startDate, form.endDate];
    const limit = team ? MAX_WINDOW_DAYS : MAX_RANGE_DAYS;
    if (to < from) {
      setError('The end date must be on or after the start date.');
      return;
    }
    if (daysBetween(from, to) + 1 > limit) {
      setError(`Please keep the ${team ? 'search window' : 'trip window'} to ${limit} days or fewer.`);
      return;
    }
    if (team && form.teamId === null) {
      setError('Choose a team to follow.');
      return;
    }
    if (form.mode === 'destination' && !form.base) {
      setError('Choose the city you are going to.');
      return;
    }

    // Where travel is measured from: the destination city, or an optional starting city.
    const origin = form.mode === 'destination' ? form.base : form.home;
    const options = {
      startDate: from,
      endDate: to,
      home: origin,
      returnHome: form.mode === 'destination' && form.stay ? true : form.roundTrip,
      preferredTeamIds: team && form.teamId !== null ? [form.teamId] : form.preferredTeamIds,
      mustParkIds: form.mustParkIds,
      includeVisited: form.includeVisited,
      maxDriveHours: form.maxDriveHours,
      allowFlying: form.mode === 'destination' && form.stay ? false : form.allowFlying,
      maxGames: form.maxGames,
      visited: visitedIds,
      wishlist: wishlistIds,
      ...(team ? { teamOnly: form.teamOnly, teamWeight: 12, maxSpanDays: form.tripDays } : {}),
    };

    setBusy(true);
    try {
      const [games, travel] = await Promise.all([fetchHomeGames(from, to), buildTravel(origin)]);
      const plan = form.mode === 'destination' && form.stay && origin ? planHub(games, options, travel, origin) : planTrips(games, options, travel);
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
    const season = seasonWindow();
    setForm((f) => ({ ...f, startDate: s.startDate, endDate: s.endDate, windowStart: season.startDate, windowEnd: season.endDate }));
    setResult(null);
    setShowForm(true);
  };

  const it = result?.itineraries[selected];

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h-display text-4xl leading-none">Trip Planner</h1>
          <p className="mt-1 text-sm text-muted">Plan around your dates, a team, or a destination. We&apos;ll find realistic routes that hit the parks you still need.</p>
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
              <p className="mt-1 text-sm text-muted">Set your dates and tap Plan my trip. Choose what you&apos;re planning around (dates, a team, or a destination) and we&apos;ll read the MLB schedule, check real drive times, and favor parks you haven&apos;t visited.</p>
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
                    <div className="text-xs opacity-80">{o.stops.length} {o.stops.length === 1 ? "game" : "games"} · {o.totalMiles.toLocaleString()} mi</div>
                    <div className="text-xs font-semibold opacity-90">{rangeLabel(o)}</div>
                  </button>
                ))}
              </div>
              <ItineraryView key={it.id + planned.startDate + planned.mode} itinerary={it} home={planned.mode === 'destination' ? planned.base : planned.home} />
            </div>
          )}
        </section>
      </div>
      <SocialShareModal />
    </main>
  );
}
