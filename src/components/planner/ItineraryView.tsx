'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bookmark, CalendarPlus, Car, ClipboardCopy, CloudSun, Home, Plane, Share2, Sparkles, Umbrella } from 'lucide-react';
import { computeStats } from '@/lib/stats';
import { fetchForecast, isForecastable, type DayForecast } from '@/lib/api/weatherApi';
import { formatLocalTime } from '@/lib/planner/engine';
import { itineraryToIcs, itineraryToText } from '@/lib/planner/export';
import type { HomePoint, Itinerary, Leg, Stop } from '@/lib/planner/types';
import { useBallparkStore } from '@/store/useBallparkStore';
import { emptyEntry } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { RouteMap } from './RouteMap';

function hoursLabel(h: number): string {
  const total = Math.round(h * 60);
  const hr = Math.floor(total / 60);
  const min = total % 60;
  return hr ? `${hr}h ${String(min).padStart(2, '0')}m` : `${min}m`;
}

function LegRow({ leg, label }: { leg: Leg; label?: string }) {
  const fly = leg.mode === 'fly';
  return (
    <div className="my-1 ml-[15px] flex items-center gap-2 border-l-2 border-dashed border-silver py-2 pl-5 text-xs text-muted">
      {fly ? <Plane size={14} className="text-brand" /> : <Car size={14} />}
      <span>
        {label ?? (fly ? 'Fly' : 'Drive')} · {hoursLabel(leg.hours)} · {Math.round(leg.miles).toLocaleString()} mi
        {leg.source === 'estimate' && !fly ? ' (est.)' : ''}
        {fly ? ' door to door (est.)' : ''}
      </span>
    </div>
  );
}

function StopCard({ stop, index }: { stop: Stop; index: number }) {
  const { game, park } = stop;
  const [forecast, setForecast] = useState<DayForecast | null>(null);

  useEffect(() => {
    if (!isForecastable(game.date)) return;
    let alive = true;
    void fetchForecast(park.coordinates[1], park.coordinates[0], game.date).then((f) => alive && setForecast(f));
    return () => {
      alive = false;
    };
  }, [game.date, park]);

  return (
    <li className="flex gap-3">
      <div className="flex w-8 shrink-0 justify-center pt-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-full font-display text-base font-bold text-white" style={{ background: park.primaryColor }}>
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-1 rounded-lg border border-line bg-white p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {formatDate(game.date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatLocalTime(game.startUtc, park.timeZone)} · {game.dayNight === 'day' ? 'Day game' : 'Night game'}
          </span>
          {stop.isNew && <span className="rounded-full bg-ok-50 px-2 py-0.5 text-[11px] font-bold text-ok">New park</span>}
          {stop.isWishlist && stop.isNew && <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand"><Bookmark size={10} fill="currentColor" /> Wishlist</span>}
          {!stop.isNew && <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-muted">Return visit</span>}
          {(stop.preferredHome || stop.preferredAway) && <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-white">Your team</span>}
        </div>
        <div className="mt-1 font-display text-xl font-bold leading-tight">
          {game.awayName} at {game.homeName}
        </div>
        <div className="text-sm text-muted">
          {park.venue} · {park.city}, {park.state}
        </div>
        {(game.awayPitcher || game.homePitcher) && (
          <div className="mt-1 text-xs text-muted">
            Probable: {game.awayPitcher || 'TBD'} vs {game.homePitcher || 'TBD'}
          </div>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {forecast && (
            <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-medium">
              <CloudSun size={13} /> {forecast.summary}, {forecast.highF}°F{park.roof === 'open' ? `, ${forecast.rainPct}% rain` : ''}
            </span>
          )}
          {park.roof !== 'open' && (
            <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-medium">
              <Umbrella size={13} /> {park.roof === 'dome' ? 'Domed' : 'Retractable roof'}
            </span>
          )}
          <span className="rounded-full bg-surface px-2.5 py-1 font-medium">Try: {park.localClassicConcession}</span>
        </div>
        {stop.warnings.map((w) => (
          <p key={w} className="mt-2 flex items-start gap-1.5 text-xs font-medium text-brand">
            <AlertTriangle size={14} className="mt-px shrink-0" /> {w}
          </p>
        ))}
      </div>
    </li>
  );
}

interface Props {
  itinerary: Itinerary;
  home: HomePoint | null;
}

export function ItineraryView({ itinerary, home }: Props) {
  const entries = useBallparkStore((s) => s.entries);
  const setStatus = useBallparkStore((s) => s.setStatus);
  const openShare = useBallparkStore((s) => s.openShare);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const impact = useMemo(() => {
    const before = computeStats(entries);
    const hypo = { ...entries };
    for (const s of itinerary.stops) {
      if (s.isNew) hypo[s.park.id] = { ...(entries[s.park.id] ?? emptyEntry()), status: 'visited' };
    }
    const after = computeStats(hypo);
    return {
      before: before.visited,
      after: after.visited,
      sweeps: after.divisions.filter((d, i) => d.swept && !before.divisions[i].swept).map((d) => `${d.league} ${d.division}`),
      badges: after.badges.filter((b, i) => b.earned && !before.badges[i].earned).map((b) => b.name),
    };
  }, [entries, itinerary]);

  const download = () => {
    const blob = new Blob([itineraryToIcs(itinerary)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ballpark-trip.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(itineraryToText(itinerary));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const wishlistAll = () => {
    for (const s of itinerary.stops) {
      if (s.isNew && (entries[s.park.id]?.status ?? 'unvisited') === 'unvisited') setStatus(s.park.id, 'wishlist');
    }
    setSaved(true);
  };

  const hours = itinerary.travelHours;

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <RouteMap itinerary={itinerary} home={home} className="h-[260px] sm:h-[320px]" />
        <div className="grid grid-cols-2 gap-px bg-line text-center sm:grid-cols-4">
          {[
            { v: `${itinerary.stops.length}`, l: 'Games' },
            { v: `${itinerary.newParks}`, l: 'New parks' },
            { v: `${itinerary.totalMiles.toLocaleString()}`, l: 'Miles' },
            { v: hoursLabel(hours), l: 'Travel time' },
          ].map((m) => (
            <div key={m.l} className="bg-white py-3">
              <div className="font-display text-2xl font-bold leading-none">{m.v}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted">{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy/15 bg-navy-50 p-3 text-sm">
        <div className="flex items-center gap-2 font-semibold"><Sparkles size={16} className="text-brand" /> What this does for your passport</div>
        <p className="mt-1">
          {impact.before}/30 <span className="text-muted">to</span> <b>{impact.after}/30</b> ballparks.
          {impact.sweeps.length > 0 && <> Completes the <b>{impact.sweeps.join(', ')}</b> sweep.</>}
          {impact.badges.length > 0 && <> Unlocks <b>{impact.badges.join(', ')}</b>.</>}
          {itinerary.newParks === 0 && ' No new parks on this route.'}
        </p>
      </div>

      {itinerary.missingMust.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm font-medium text-brand">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Could not fit every must-visit park in these dates. Missing: {itinerary.missingMust.join(', ').toUpperCase()}.
        </p>
      )}

      <ol>
        {home && itinerary.stops[0]?.leg && (
          <li className="mb-1 flex items-center gap-3 text-sm font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white"><Home size={15} /></span>
            {home.label}
          </li>
        )}
        {itinerary.stops.map((s, i) => (
          <div key={s.game.gamePk}>
            {s.leg && <LegRow leg={s.leg} />}
            <StopCard stop={s} index={i} />
          </div>
        ))}
        {itinerary.returnLeg && home && (
          <div>
            <LegRow leg={itinerary.returnLeg} label="Trip home" />
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white"><Home size={15} /></span>
              {home.label}
            </div>
          </div>
        )}
      </ol>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={download} className="btn-navy"><CalendarPlus size={17} /> Add to calendar</button>
        <button type="button" onClick={() => openShare({ card: 'trip', trip: { itinerary, home } })} className="btn-primary"><Share2 size={17} /> Share trip</button>
        <button type="button" onClick={copy} className="btn-ghost"><ClipboardCopy size={17} /> {copied ? 'Copied' : 'Copy itinerary'}</button>
        <button type="button" onClick={wishlistAll} disabled={saved || itinerary.newParks === 0} className={cn('btn-ghost', saved && '!border-ok !text-ok')}>
          <Bookmark size={17} /> {saved ? 'On your wishlist' : 'Wishlist these parks'}
        </button>
      </div>
      <p className="text-xs text-muted">Drive times use public road data; flight times are door-to-door estimates. Always confirm game times and tickets with the club before you travel.</p>
    </div>
  );
}
