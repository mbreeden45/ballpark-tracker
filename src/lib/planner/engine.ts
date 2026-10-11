import { getPark } from '../parks';
import type { HomeGame } from '../api/scheduleApi';
import { HOME_ID, chooseLeg, returnLeg, type Travel } from './travel';
import type { HomePoint, Itinerary, Leg, PlanResult, PlannerOptions, Stop } from './types';

const HOUR = 3_600_000;
/** Typical game length plus time to leave the ballpark. */
const GAME_AND_EXIT_MS = 3.75 * HOUR;
/** Buffer to park, find the seat, and get settled before first pitch. */
const ARRIVAL_BUFFER_MS = 1 * HOUR;
/** Games more than this far apart are not chained back to back. */
const MAX_GAP_MS = 60 * HOUR;
const BEAM_WIDTH = 3000;
const TIGHT_SLACK_MS = 1.5 * HOUR;

interface Chain {
  idx: number[];
  parkIds: Set<string>;
  legs: (Leg | null)[];
  score: number;
  mustHit: number;
}

export function formatLocalTime(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone }).format(ms);
}

function localHour(ms: number, timeZone: string): number {
  return Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone }).format(ms)) % 24;
}

function legCost(leg: Leg | null): number {
  if (!leg) return 0;
  return leg.mode === 'drive' ? leg.hours : 2.5 + leg.hours * 0.3;
}

function gameValue(game: HomeGame, opts: PlannerOptions, preferred: Set<number>): number {
  const isNew = !opts.visited.has(game.parkId);
  const tw = opts.teamWeight ?? 8;
  let v = isNew ? 10 : 1.5;
  if (isNew && opts.wishlist.has(game.parkId)) v += 4;
  if (preferred.has(game.homeTeamId)) v += tw;
  if (preferred.has(game.awayTeamId)) v += isNew ? tw * 0.625 : tw * 0.25;
  return v;
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function filterPool(allGames: HomeGame[], opts: PlannerOptions): HomeGame[] {
  const preferred = new Set(opts.preferredTeamIds);
  return allGames
    .filter((g) => g.date >= opts.startDate && g.date <= opts.endDate)
    .filter((g) => opts.includeVisited || !opts.visited.has(g.parkId))
    .filter((g) => !(opts.teamOnly && preferred.size > 0) || preferred.has(g.homeTeamId) || preferred.has(g.awayTeamId))
    .sort((a, b) => a.startUtc - b.startUtc);
}

function windowStartUtc(startDate: string): number {
  const [y, m, d] = startDate.split('-').map(Number);
  // 14:00 UTC is mid-morning on the East Coast and early morning on the West Coast.
  return Date.UTC(y, m - 1, d, 14, 0, 0);
}

function arrivalMs(prev: HomeGame, leg: Leg): number {
  return prev.startUtc + GAME_AND_EXIT_MS + leg.hours * HOUR;
}

/** Searches the schedule for back-to-back games that are physically possible and rewards new parks. */
export function planTrips(allGames: HomeGame[], opts: PlannerOptions, travel: Travel): PlanResult {
  const preferred = new Set(opts.preferredTeamIds);
  const must = new Set(opts.mustParkIds);
  const winStart = windowStartUtc(opts.startDate);

  const pool = filterPool(allGames, opts);

  const mustBonus = (parkId: string, chain: Set<string>) => (must.has(parkId) && !chain.has(parkId) ? 25 : 0);
  const all: Chain[] = [];
  let frontier: Chain[] = [];

  pool.forEach((g, i) => {
    let leg: Leg | null = null;
    if (opts.home) {
      leg = chooseLeg(travel, HOME_ID, g.parkId, opts.maxDriveHours, opts.allowFlying);
      if (!leg) return;
      if (g.startUtc - leg.hours * HOUR - ARRIVAL_BUFFER_MS < winStart) return;
    }
    const empty = new Set<string>();
    frontier.push({
      idx: [i],
      parkIds: new Set([g.parkId]),
      legs: [leg],
      score: gameValue(g, opts, preferred) + mustBonus(g.parkId, empty) - legCost(leg),
      mustHit: must.has(g.parkId) ? 1 : 0,
    });
  });
  all.push(...frontier);

  for (let level = 2; level <= opts.maxGames && frontier.length; level++) {
    const next: Chain[] = [];
    for (const chain of frontier) {
      const lastIdx = chain.idx[chain.idx.length - 1];
      const last = pool[lastIdx];
      for (let j = lastIdx + 1; j < pool.length; j++) {
        const g = pool[j];
        const gap = g.startUtc - last.startUtc;
        if (gap > MAX_GAP_MS) break;
        if (opts.maxSpanDays && dayNumber(g.date) - dayNumber(pool[chain.idx[0]].date) + 1 > opts.maxSpanDays) break;
        if (chain.parkIds.has(g.parkId)) continue;
        const leg = chooseLeg(travel, last.parkId, g.parkId, opts.maxDriveHours, opts.allowFlying);
        if (!leg) continue;
        const arrive = arrivalMs(last, leg);
        if (arrive + ARRIVAL_BUFFER_MS > g.startUtc) continue;

        const park = getPark(g.parkId);
        let penalty = 0;
        if (park) {
          const hr = localHour(arrive, park.timeZone);
          // Nobody wants a multi-hour overnight drive between games.
          if (hr >= 1 && hr < 6 && leg.hours >= 2.5) continue;
          if (hr >= 0 && hr < 6) penalty += 1.5;
        }
        if (g.startUtc - arrive - ARRIVAL_BUFFER_MS < TIGHT_SLACK_MS - ARRIVAL_BUFFER_MS) penalty += 0.5;

        const parkIds = new Set(chain.parkIds);
        parkIds.add(g.parkId);
        next.push({
          idx: [...chain.idx, j],
          parkIds,
          legs: [...chain.legs, leg],
          score: chain.score + gameValue(g, opts, preferred) + mustBonus(g.parkId, chain.parkIds) - legCost(leg) - penalty,
          mustHit: chain.mustHit + (must.has(g.parkId) ? 1 : 0),
        });
      }
    }
    next.sort((a, b) => b.score - a.score);
    frontier = next.slice(0, BEAM_WIDTH);
    all.push(...frontier);
  }

  const complete = all.filter((c) => c.mustHit === must.size);
  const ranked =
    must.size > 0 && !complete.length
      ? [...all].sort((a, b) => b.mustHit - a.mustHit || b.score - a.score)
      : [...complete].sort((a, b) => b.score - a.score);

  // Pick up to three meaningfully different itineraries.
  const picked: Chain[] = [];
  for (const c of ranked) {
    const distinct = picked.every((p) => {
      let diff = 0;
      c.parkIds.forEach((id) => !p.parkIds.has(id) && diff++);
      p.parkIds.forEach((id) => !c.parkIds.has(id) && diff++);
      const gapDays = Math.abs(dayNumber(pool[c.idx[0]].date) - dayNumber(pool[p.idx[0]].date));
      return diff >= 2 || gapDays >= 7;
    });
    if (distinct) picked.push(c);
    if (picked.length === 3) break;
  }

  // Drop alternatives that are far weaker than the best option; a one-game "option" is not a plan.
  const strong = picked.filter((c) => c.score >= (picked[0]?.score ?? 0) * 0.65);
  const itineraries = strong.map((c, n) => buildItinerary(c, pool, opts, travel, preferred, n));
  labelItineraries(itineraries);
  return { itineraries, gamesConsidered: pool.length, roadDataUsed: travel.roadDataUsed };
}

function buildItinerary(chain: Chain, pool: HomeGame[], opts: PlannerOptions, travel: Travel, preferred: Set<number>, n: number): Itinerary {
  const stops: Stop[] = chain.idx.map((gi, k) => {
    const game = pool[gi];
    const park = getPark(game.parkId)!;
    const leg = chain.legs[k];
    const warnings: string[] = [];
    if (leg) {
      const prev = k > 0 ? pool[chain.idx[k - 1]] : null;
      if (prev) {
        const arrive = arrivalMs(prev, leg);
        const slack = game.startUtc - arrive - ARRIVAL_BUFFER_MS;
        const hr = localHour(arrive, park.timeZone);
        if (hr >= 0 && hr < 6) warnings.push(`Late arrival, around ${formatLocalTime(arrive, park.timeZone)} local time`);
        if (slack < TIGHT_SLACK_MS - ARRIVAL_BUFFER_MS) warnings.push(`Tight turnaround: about ${Math.max(0, Math.round(slack / 60000))} minutes of cushion`);
      }
      if (leg.mode === 'drive' && leg.hours >= 4.5) warnings.push('Long drive. Consider sharing it.');
    }
    if (game.doubleHeader) warnings.push(`Doubleheader, game ${game.gameNumber}. Double-check which game you want.`);
    return {
      game,
      park,
      leg,
      isNew: !opts.visited.has(game.parkId),
      isWishlist: opts.wishlist.has(game.parkId),
      preferredHome: preferred.has(game.homeTeamId),
      preferredAway: preferred.has(game.awayTeamId),
      warnings,
    };
  });

  const last = stops[stops.length - 1];
  const back = opts.home && opts.returnHome ? returnLeg(travel, last.park.id, HOME_ID, opts.maxDriveHours, opts.allowFlying) : null;
  const legs = [...stops.map((s) => s.leg), back].filter((l): l is Leg => l !== null);
  const missingMust = opts.mustParkIds.filter((id) => !chain.parkIds.has(id));

  return {
    id: `option-${n + 1}`,
    tag: `Option ${n + 1}`,
    stops,
    returnLeg: back,
    newParks: stops.filter((s) => s.isNew).length,
    totalMiles: Math.round(legs.reduce((sum, l) => sum + l.miles, 0)),
    travelHours: legs.reduce((sum, l) => sum + l.hours, 0),
    flights: legs.filter((l) => l.mode === 'fly').length,
    preferredGames: stops.filter((s) => s.preferredHome || s.preferredAway).length,
    score: chain.score,
    missingMust,
  };
}

/** Gives each option a distinct headline based on what it does best. */
function labelItineraries(list: Itinerary[]): void {
  if (!list.length) return;
  const used = new Set<Itinerary>();
  const assign = (label: string, better: (a: Itinerary, b: Itinerary) => boolean, eligible: (i: Itinerary) => boolean = () => true) => {
    const pool = list.filter((i) => !used.has(i) && eligible(i));
    if (!pool.length) return;
    const best = pool.reduce((a, b) => (better(b, a) ? b : a));
    best.tag = label;
    used.add(best);
  };
  assign('Most new parks', (a, b) => a.newParks > b.newParks || (a.newParks === b.newParks && a.score > b.score));
  assign('Your teams', (a, b) => a.preferredGames > b.preferredGames, (i) => i.preferredGames > 0);
  assign('Easiest travel', (a, b) => a.travelHours / a.stops.length < b.travelHours / b.stops.length);
  list.forEach((i, n) => {
    if (i.tag.startsWith('Option')) i.tag = `Option ${n + 1}`;
  });
}


/**
 * Stay-in-one-place planning: you keep a base city and day-trip to games within your drive limit.
 * Each day holds at most one game, and each ballpark appears once.
 */
export function planHub(allGames: HomeGame[], opts: PlannerOptions, travel: Travel, base: HomePoint): PlanResult {
  const preferred = new Set(opts.preferredTeamIds);
  const pool = filterPool(allGames, opts);

  interface Candidate {
    game: HomeGame;
    leg: Leg;
    value: number;
  }
  const candidates: Candidate[] = [];
  for (const game of pool) {
    const road = travel.drive(HOME_ID, game.parkId);
    if (road.hours > opts.maxDriveHours) continue;
    const leg: Leg = { mode: 'drive', hours: road.hours, miles: road.miles, fromLabel: base.label, source: road.source };
    candidates.push({ game, leg, value: gameValue(game, opts, preferred) - leg.hours * 0.8 });
  }

  const options: Itinerary[] = [];
  const usedParks = new Set<string>();
  for (let n = 0; n < 3; n++) {
    const takenDays = new Set<string>();
    const takenParks = new Set<string>();
    const chosen: Candidate[] = [];
    for (const c of [...candidates].sort((a, b) => b.value - a.value)) {
      if (chosen.length >= opts.maxGames) break;
      if (usedParks.has(c.game.parkId) || takenParks.has(c.game.parkId) || takenDays.has(c.game.date)) continue;
      chosen.push(c);
      takenDays.add(c.game.date);
      takenParks.add(c.game.parkId);
    }
    if (!chosen.length) break;
    const total = chosen.reduce((sum, c) => sum + c.value, 0);
    if (options.length && total < options[0].score * 0.5) break;
    chosen.sort((a, b) => a.game.startUtc - b.game.startUtc);
    chosen.forEach((c) => usedParks.add(c.game.parkId));

    const stops: Stop[] = chosen.map((c) => {
      const park = getPark(c.game.parkId)!;
      const warnings: string[] = [];
      if (c.game.dayNight === 'night' && c.leg.hours >= 2.5) warnings.push(`Night game plus about ${c.leg.hours.toFixed(1)} hours back to ${base.label}`);
      if (c.game.doubleHeader) warnings.push(`Doubleheader, game ${c.game.gameNumber}. Double-check which game you want.`);
      return {
        game: c.game,
        park,
        leg: c.leg,
        isNew: !opts.visited.has(c.game.parkId),
        isWishlist: opts.wishlist.has(c.game.parkId),
        preferredHome: preferred.has(c.game.homeTeamId),
        preferredAway: preferred.has(c.game.awayTeamId),
        warnings,
      };
    });
    options.push({
      id: `option-${n + 1}`,
      tag: `Option ${n + 1}`,
      stops,
      returnLeg: null,
      newParks: stops.filter((s) => s.isNew).length,
      totalMiles: Math.round(chosen.reduce((sum, c) => sum + c.leg.miles * 2, 0)),
      travelHours: chosen.reduce((sum, c) => sum + c.leg.hours * 2, 0),
      flights: 0,
      preferredGames: stops.filter((s) => s.preferredHome || s.preferredAway).length,
      score: chosen.reduce((sum, c) => sum + c.value, 0),
      missingMust: [],
      hub: base,
    });
  }
  options.forEach((o, i) => (o.tag = i === 0 ? 'Best picks' : `Option ${i + 1}`));
  return { itineraries: options, gamesConsidered: pool.length, roadDataUsed: travel.roadDataUsed };
}
