import { PARKS } from '../parks';
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
  team: { id: number; name: string; abbreviation?: string; venue?: { id: number } };
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
  venue?: { id: number };
}

interface ApiResponse {
  dates?: { date: string; games: ApiGame[] }[];
}

const cache = new Map<string, HomeGame[]>();
const parkByTeam = new Map<number, Ballpark>(PARKS.map((p) => [p.mlbId, p]));

/** Ask the API for only what the planner reads; a full season shrinks from many MB to about 1.4 MB. */
const FIELDS =
  'dates,date,games,gamePk,gameDate,officialDate,dayNight,doubleHeader,gameNumber,status,detailedState,abstractGameState,teams,home,away,team,id,name,abbreviation,venue,probablePitcher,fullName';

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
    `&hydrate=team,probablePitcher&fields=${FIELDS}`;
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
      // Neutral-site games (international series, special events) are not played at the club's own venue.
      const homeVenueId = g.teams.home.team.venue?.id;
      if (homeVenueId !== undefined && g.venue?.id !== undefined && g.venue.id !== homeVenueId) continue;
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
