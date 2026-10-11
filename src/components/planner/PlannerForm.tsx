'use client';

import { useMemo, type ReactNode } from 'react';
import { CalendarDays, MapPin, Shirt } from 'lucide-react';
import { PARKS } from '@/lib/parks';
import { cn, todayISO } from '@/lib/utils';
import type { HomePoint } from '@/lib/planner/types';
import { CityPicker } from './CityPicker';

export type PlanMode = 'dates' | 'team' | 'destination';

export interface FormState {
  mode: PlanMode;
  /** Trip dates (dates and destination modes). */
  startDate: string;
  endDate: string;
  /** Season window to search (team mode). */
  windowStart: string;
  windowEnd: string;
  tripDays: number;
  teamId: number | null;
  teamOnly: boolean;
  /** Where the trip starts, when the user wants it to count (dates and team modes). */
  home: HomePoint | null;
  /** The place you are going (destination mode). */
  base: HomePoint | null;
  roundTrip: boolean;
  /** Destination mode: stay put and day-trip, instead of moving between cities. */
  stay: boolean;
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

/** The current season, or the last full season when it is the offseason. */
export function seasonWindow(): { startDate: string; endDate: string; year: number; offseason: boolean } {
  const now = new Date();
  const offseason = now.getMonth() >= 9 || now.getMonth() < 2;
  const year = now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear();
  const start = offseason ? `${year}-04-01` : todayISO();
  return { startDate: start, endDate: `${year}-09-28`, year, offseason };
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

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
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

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; hint?: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('min-h-[42px] flex-1 rounded-md px-2 text-sm font-semibold transition', value === o.id ? 'bg-navy text-white shadow-card' : 'text-muted hover:text-navy')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="h-display mb-2 flex items-center gap-2 text-xl">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy font-body text-xs font-bold text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const MODES: { id: PlanMode; title: string; hint: string; icon: typeof CalendarDays }[] = [
  { id: 'dates', title: 'My dates', hint: 'I know when I can go', icon: CalendarDays },
  { id: 'team', title: 'A team', hint: 'Follow them to new parks', icon: Shirt },
  { id: 'destination', title: 'A destination', hint: "I'm heading somewhere", icon: MapPin },
];

export function PlannerForm({ value, onChange, onSubmit, busy, error, visitedIds }: Props) {
  const set = <K extends keyof FormState>(key: K, v: FormState[K]) => onChange({ ...value, [key]: v });
  const today = todayISO();
  const sample = sampleWindow();
  const season = seasonWindow();
  const candidateParks = useMemo(() => PARKS.filter((p) => value.includeVisited || !visitedIds.has(p.id)), [value.includeVisited, visitedIds]);
  const teams = useMemo(() => [...PARKS].sort((a, b) => a.franchise.localeCompare(b.franchise)), []);
  const { mode } = value;
  let step = 1;

  const quickChips = (items: { label: string; start: string; end: string }[], apply: (s: string, e: string) => void) => (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((q) => (
        <button key={q.label} type="button" onClick={() => apply(q.start, q.end)} className="min-h-[36px] rounded-full border border-line bg-white px-3 text-xs font-semibold text-muted hover:text-navy">
          {q.label}
        </button>
      ))}
    </div>
  );

  const teamChips = (
    <details className="rounded-lg border border-line bg-white">
      <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 text-sm font-semibold">
        <span>{value.preferredTeamIds.length ? `${value.preferredTeamIds.length} selected` : 'Any team'}</span>
        <span className="text-xs font-normal text-muted">Tap to choose</span>
      </summary>
      <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
        {PARKS.map((p) => {
          const on = value.preferredTeamIds.includes(p.mlbId);
          return (
            <button key={p.id} type="button" aria-pressed={on} onClick={() => set('preferredTeamIds', toggle(value.preferredTeamIds, p.mlbId))} className={cn('min-h-[36px] rounded-full border px-3 text-xs font-semibold', on ? 'border-navy bg-navy text-white' : 'border-line text-muted')}>
              {p.abbr}
            </button>
          );
        })}
      </div>
    </details>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="card space-y-5 p-4"
    >
      <section>
        <h2 className="h-display mb-2 text-xl">What are you planning around?</h2>
        <div role="radiogroup" aria-label="Plan around" className="grid grid-cols-3 gap-2">
          {MODES.map(({ id, title, hint, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              onClick={() => set('mode', id)}
              className={cn('flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition', mode === id ? 'border-navy bg-navy text-white shadow-card' : 'border-line bg-white hover:border-navy/40')}
            >
              <Icon size={20} />
              <span className="text-sm font-bold leading-tight">{title}</span>
              <span className={cn('text-[11px] leading-tight', mode === id ? 'text-white/75' : 'text-muted')}>{hint}</span>
            </button>
          ))}
        </div>
      </section>

      {mode === 'team' && (
        <Step n={step++} title="Which team?">
          <label className="sr-only" htmlFor="plan-team">Team</label>
          <select id="plan-team" value={value.teamId ?? ''} onChange={(e) => set('teamId', e.target.value ? Number(e.target.value) : null)} className="field-input" required>
            <option value="">Choose a team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.mlbId}>{t.franchise}</option>
            ))}
          </select>
          <div className="mt-2">
            <Segmented
              label="Team games"
              value={value.teamOnly ? 'only' : 'favor'}
              onChange={(v) => set('teamOnly', v === 'only')}
              options={[
                { id: 'only', label: 'Only their games' },
                { id: 'favor', label: 'Favor their games' },
              ]}
            />
            <p className="mt-1 text-xs text-muted">
              {value.teamOnly ? 'Every game on the trip involves this team. Teams play in blocks, so a week usually reaches 2 to 3 stadiums.' : 'Their games come first, with other games filling the gaps so you can see more parks.'}
            </p>
          </div>
        </Step>
      )}

      {mode === 'destination' && (
        <Step n={step++} title="Where are you going?">
          <CityPicker value={value.base} onChange={(b) => set('base', b)} placeholder="Destination city, e.g. Boston" />
          <div className="mt-2">
            <Segmented
              label="Style"
              value={value.stay ? 'stay' : 'move'}
              onChange={(v) => set('stay', v === 'stay')}
              options={[
                { id: 'stay', label: 'Stay in one place' },
                { id: 'move', label: 'Move between cities' },
              ]}
            />
            <p className="mt-1 text-xs text-muted">
              {value.stay ? "You sleep in this city every night and take day trips to games within your drive limit." : 'This city is where the trip starts. We chain games across cities from there.'}
            </p>
          </div>
        </Step>
      )}

      <Step n={step++} title={mode === 'team' ? 'Find the best week between' : 'When?'}>
        {mode === 'team' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="label">From</span>
                <input type="date" className="field-input" value={value.windowStart} onChange={(e) => set('windowStart', e.target.value)} required />
              </label>
              <label>
                <span className="label">To</span>
                <input type="date" className="field-input" value={value.windowEnd} min={value.windowStart} onChange={(e) => set('windowEnd', e.target.value)} required />
              </label>
            </div>
            {quickChips(
              [{ label: season.offseason ? `Sample season ${season.year}` : 'Rest of season', start: season.startDate, end: season.endDate }],
              (s, e) => onChange({ ...value, windowStart: s, windowEnd: e }),
            )}
            <label className="mt-3 block">
              <span className="label flex justify-between"><span>Trip length</span><span className="text-navy">{value.tripDays} days</span></span>
              <input type="range" min={2} max={10} value={value.tripDays} onChange={(e) => set('tripDays', Number(e.target.value))} className="w-full accent-navy" />
            </label>
          </>
        ) : (
          <>
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
            {quickChips(
              [
                { label: 'Next 7 days', start: today, end: addDays(today, 6) },
                { label: 'Next 14 days', start: today, end: addDays(today, 13) },
                { label: 'Sample week', start: sample.startDate, end: sample.endDate },
              ],
              (s, e) => onChange({ ...value, startDate: s, endDate: e }),
            )}
          </>
        )}
      </Step>

      {!(mode === 'destination' && value.stay) && (
        <Step n={step++} title={mode === 'destination' ? 'How does it end?' : 'Starting from'}>
          {mode !== 'destination' && <CityPicker value={value.home} onChange={(h) => set('home', h)} />}
          {(mode === 'destination' || value.home) && (
            <div className={mode === 'destination' ? '' : 'mt-2'}>
              <Segmented
                label="Trip type"
                value={value.roundTrip ? 'round' : 'one'}
                onChange={(v) => set('roundTrip', v === 'round')}
                options={[
                  { id: 'round', label: 'Round trip' },
                  { id: 'one', label: 'One way' },
                ]}
              />
              <p className="mt-1 text-xs text-muted">{value.roundTrip ? 'The trip back is counted in miles and hours.' : 'The trip ends at the last ballpark, with no ride back counted.'}</p>
            </div>
          )}
          {mode !== 'destination' && !value.home && <p className="mt-1 text-xs text-muted">Optional. With a starting city, the first game has to be reachable from there.</p>}
        </Step>
      )}

      {mode !== 'team' && (
        <Step n={step++} title="Teams you want to see">
          {teamChips}
          <p className="mt-1 text-xs text-muted">Games involving these teams, at home or on the road, are favored.</p>
        </Step>
      )}

      <Step n={step++} title="Your limits">
        <div className="space-y-3">
          <label className="block">
            <span className="label flex justify-between">
              <span>{mode === 'destination' && value.stay ? 'Longest one-way drive from your base' : 'Longest drive between games'}</span>
              <span className="text-navy">{value.maxDriveHours} h</span>
            </span>
            <input type="range" min={1} max={10} step={0.5} value={value.maxDriveHours} onChange={(e) => set('maxDriveHours', Number(e.target.value))} className="w-full accent-navy" />
          </label>
          {!(mode === 'destination' && value.stay) && <Switch checked={value.allowFlying} onChange={(v) => set('allowFlying', v)} label="Allow flights" hint="Estimated door to door; fares not included" />}
          <label className="block">
            <span className="label flex justify-between"><span>Most games</span><span className="text-navy">{value.maxGames}</span></span>
            <input type="range" min={1} max={10} value={value.maxGames} onChange={(e) => set('maxGames', Number(e.target.value))} className="w-full accent-navy" />
          </label>
          <Switch checked={value.includeVisited} onChange={(v) => set('includeVisited', v)} label="Include parks I've visited" hint={`${visitedIds.size} marked visited in your passport`} />
          <details className="rounded-lg border border-line bg-white">
            <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-3 text-sm font-semibold">
              <span>{value.mustParkIds.length ? `${value.mustParkIds.length} must-hit parks` : 'Parks I must hit (optional)'}</span>
              <span className="text-xs font-normal text-muted">Tap to choose</span>
            </summary>
            <div className="flex flex-wrap gap-1.5 border-t border-line p-3">
              {candidateParks.map((p) => {
                const on = value.mustParkIds.includes(p.id);
                return (
                  <button key={p.id} type="button" aria-pressed={on} onClick={() => set('mustParkIds', toggle(value.mustParkIds, p.id))} className={cn('min-h-[36px] rounded-full border px-3 text-xs font-semibold', on ? 'border-brand bg-brand text-white' : 'border-line text-muted')}>
                    {p.abbr}
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </Step>

      {error && <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Searching the schedule…' : mode === 'team' ? 'Find my best weeks' : 'Plan my trip'}
      </button>
    </form>
  );
}
