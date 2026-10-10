import { PARKS } from '../parks';
import { haversineMiles } from '../utils';
import type { Ballpark } from '../types';

export interface HomeGame {
  gamePk: number;
  parkId: string;
  /** First pitch as epoch milliseconds (UTC). */
  startUtc: number;
  /** Local calendar date at the ballpark (YYYY-MM-DD). */
  date: string;
  dayNight: 'day' | 'night';
  homeTeamId: number;
  homeName: string;
  awayTeamId: number;
  awayName: string;
  awayAbbr: string;
  homeAbbr: string;
  homePitcher: string;
  awayPitcher: string;
  status: string;
  doubleHeader: boolean;
  gameNumber: number;
}

interface ApiTeam {
  team: { id: number; name: string; abbreviation?: string };
  probablePitcher?: { fullName?: string };
}

interface ApiGame {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  dayNight?: string;
  doubleHeader?: string;
  gameNumber?: number;
  status?: { detailedState?: string; abstractGameState?: string };
  teams: { home: ApiTeam; away: ApiTeam };
  venue?: { location?: { defaultCoordinates?: { latitude: number; longitude: number } } };
}

interface ApiResponse {
  dates?: { date: string; games: ApiGame[] }[];
}

const cache = new Map<string, HomeGame[]>();
const parkByTeam = new Map<number, Ballpark>(PARKS.map((p) => [p.mlbId, p]));

/** A game counts as a home-park game when the venue is within this distance of the club's ballpark. */
const NEUTRAL_SITE_MILES = 25;

/**
 * Loads every regular-season game in a date range and keeps the ones played at a club's own ballpark.
 * Neutral-site games (international series, special events) and postponed or cancelled games are dropped.
 */
export async function fetchHomeGames(startDate: string, endDate: string, signal?: AbortSignal): Promise<HomeGame[]> {
  const key = `${startDate}:${endDate}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url =
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&gameType=R&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}` +
    '&hydrate=team,probablePitcher,venue(location)';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`MLB schedule responded ${res.status}`);
  const json = (await res.json()) as ApiResponse;

  const games: HomeGame[] = [];
  for (const day of json.dates ?? []) {
    for (const g of day.games) {
      const state = g.status?.detailedState ?? '';
      if (/postponed|cancelled|suspended/i.test(state)) continue;
      const park = parkByTeam.get(g.teams.home.team.id);
      if (!park) continue;
      const coords = g.venue?.location?.defaultCoordinates;
      if (coords && haversineMiles(park.coordinates, [coords.longitude, coords.latitude]) > NEUTRAL_SITE_MILES) continue;
      const startUtc = Date.parse(g.gameDate);
      if (Number.isNaN(startUtc)) continue;
      games.push({
        gamePk: g.gamePk,
        parkId: park.id,
        startUtc,
        date: g.officialDate,
        dayNight: g.dayNight === 'day' ? 'day' : 'night',
        homeTeamId: g.teams.home.team.id,
        homeName: g.teams.home.team.name,
        awayTeamId: g.teams.away.team.id,
        awayName: g.teams.away.team.name,
        awayAbbr: g.teams.away.team.abbreviation ?? g.teams.away.team.name,
        homeAbbr: g.teams.home.team.abbreviation ?? g.teams.home.team.name,
        homePitcher: g.teams.home.probablePitcher?.fullName ?? '',
        awayPitcher: g.teams.away.probablePitcher?.fullName ?? '',
        status: state || 'Scheduled',
        doubleHeader: g.doubleHeader === 'Y' || g.doubleHeader === 'S',
        gameNumber: g.gameNumber ?? 1,
      });
    }
  }
  games.sort((a, b) => a.startUtc - b.startUtc);
  cache.set(key, games);
  return games;
}
