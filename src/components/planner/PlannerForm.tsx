'use client';

import { useMemo } from 'react';
import { PARKS } from '@/lib/parks';
import { cn, todayISO } from '@/lib/utils';
import type { HomePoint } from '@/lib/planner/types';
import { CityPicker } from './CityPicker';

export interface FormState {
  startDate: string;
  endDate: string;
  home: HomePoint | null;
  returnHome: boolean;
  preferredTeamIds: number[];
  mustParkIds: string[];
  includeVisited: boolean;
  maxDriveHours: number;
  allowFlying: boolean;
  maxGames: number;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** A week from the most recent completed (or current) season, used when the live schedule is empty. */
export function sampleWindow(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const start = `${year}-08-03`;
  return { startDate: start, endDate: addDays(start, 6) };
}

interface Props {
  value: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string;
  visitedIds: ReadonlySet<string>;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-silver transition peer-checked:bg-navy peer-focus-visible:ring-2 peer-focus-visible:ring-navy/40 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

export function PlannerForm({ value, onChange, onSubmit, busy, error, visitedIds }: Props) {
  const set = <K extends keyof FormState>(key: K, v: FormState[K]) => onChange({ ...value, [key]: v });
  const today = todayISO();
  const sample = sampleWindow();
  const candidateParks = useMemo(() => PARKS.filter((p) => value.includeVisited || !visitedIds.has(p.id)), [value.includeVisited, visitedIds]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="card space-y-5 p-4"
    >
      <section>
        <h2 className="h-display mb-2 text-xl">When</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Start</span>
            <input type="date" className="field-input" value={value.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </label>
          <label>
            <span className="label">End</span>
            <input type="date" className="field-input" value={value.endDate} min={value.startDate} onChange={(e) => set('endDate', e.target.value)} required />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { label: 'Next 7 days', start: today, end: addDays(today, 6) },
            { label: 'Next 14 days', start: today, end: addDays(today, 13) },
            { label: 'Sample week', start: sample.startDate, end: sample.endDate },
          ].map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => onChange({ ...value, startDate: q.start, endDate: q.end })}
              className="min-h-[36px] rounded-full border border-line bg-white px-3 text-xs font-semibold text-muted hover:text-navy"
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="h-display mb-2 text-xl">Starting from</h2>
        <CityPicker value={value.home} onChange={(h) => set('home', h)} />
        {value.home && <div className="mt-1"><Toggle checked={value.returnHome} onChange={(v) => set('returnHome', v)} label="Count the trip home" hint="Adds the return leg to miles and hours" /></div>}
        {!value.home && <p className="mt-1 text-xs text-muted">Optional. With a starting city, the first game has to be reachable from home.</p>}
      </section>

      <section>
        <h2 className="h-display mb-2 text-xl">Teams you want to see</h2>
        <details className="rounded-lg border border-line bg-white">
          <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 text-sm font-semibold">
            <span>{value.preferredTeamIds.length ? `${value.preferredTeamIds.length} selected` : 'Any team'}</span>
            <span className="text-xs font-normal text-muted">Tap to choose</span>
          </summary>
          <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
            {PARKS.map((p) => {
              const on = value.preferredTeamIds.includes(p.mlbId);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('preferredTeamIds', toggle(value.preferredTeamIds, p.mlbId))}
                  className={cn('min-h-[36px] rounded-full border px-3 text-xs font-semibold', on ? 'border-navy bg-navy text-white' : 'border-line text-muted')}
                >
                  {p.abbr}
                </button>
              );
            })}
          </div>
        </details>
        <p className="mt-1 text-xs text-muted">Games involving these teams, at home or on the road, are favored.</p>
      </section>

      <section>
        <h2 className="h-display mb-2 text-xl">Parks you must hit</h2>
        <details className="rounded-lg border border-line bg-white">
          <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 text-sm font-semibold">
            <span>{value.mustParkIds.length ? `${value.mustParkIds.length} selected` : 'No requirements'}</span>
            <span className="text-xs font-normal text-muted">Tap to choose</span>
          </summary>
          <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
            {candidateParks.map((p) => {
              const on = value.mustParkIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('mustParkIds', toggle(value.mustParkIds, p.id))}
                  className={cn('min-h-[36px] rounded-full border px-3 text-xs font-semibold', on ? 'border-brand bg-brand text-white' : 'border-line text-muted')}
                >
                  {p.abbr}
                </button>
              );
            })}
          </div>
        </details>
      </section>

      <section className="space-y-3">
        <h2 className="h-display text-xl">Travel</h2>
        <label className="block">
          <span className="label flex justify-between"><span>Longest drive between games</span><span className="text-navy">{value.maxDriveHours} h</span></span>
          <input type="range" min={1} max={10} step={0.5} value={value.maxDriveHours} onChange={(e) => set('maxDriveHours', Number(e.target.value))} className="w-full accent-navy" />
        </label>
        <Toggle checked={value.allowFlying} onChange={(v) => set('allowFlying', v)} label="Allow flights" hint="Estimated door to door; fares not included" />
        <label className="block">
          <span className="label flex justify-between"><span>Most games</span><span className="text-navy">{value.maxGames}</span></span>
          <input type="range" min={1} max={10} value={value.maxGames} onChange={(e) => set('maxGames', Number(e.target.value))} className="w-full accent-navy" />
        </label>
        <Toggle checked={value.includeVisited} onChange={(v) => set('includeVisited', v)} label="Include parks I've visited" hint={`${visitedIds.size} marked visited in your passport`} />
      </section>

      {error && <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Searching the schedule…' : 'Plan my trip'}
      </button>
    </form>
  );
}
