import { PARKS } from './parks';
import type { Division, League, ParkEntry, ParkStatus } from './types';

export interface DivisionStat {
  key: string;
  league: League;
  division: Division;
  visited: number;
  total: number;
  swept: boolean;
  parkIds: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  have: number;
  total: number;
}

export interface Stats {
  visited: number;
  wishlist: number;
  total: number;
  al: number;
  nl: number;
  alTotal: number;
  nlTotal: number;
  divisions: DivisionStat[];
  sweeps: number;
  badges: Badge[];
  earnedBadges: Badge[];
}

const LEAGUES: League[] = ['AL', 'NL'];
const DIVISIONS: Division[] = ['East', 'Central', 'West'];

const PACIFIC = ['sd', 'laa', 'lad', 'sf', 'ath', 'sea'];
const GOLDEN = ['bos', 'chc', 'lad', 'laa', 'kc'];
const CROSSTOWN: [string, string][] = [
  ['nyy', 'nym'],
  ['chc', 'cws'],
  ['lad', 'laa'],
];
const I95 = ['bos', 'nym', 'nyy', 'phi', 'bal', 'wsh'];
const RUST = ['cle', 'det', 'pit', 'cin', 'stl'];

type StatusMap = Record<string, ParkEntry | undefined>;

export function statusOf(entries: StatusMap, id: string): ParkStatus {
  return entries[id]?.status ?? 'unvisited';
}

export function computeStats(entries: StatusMap): Stats {
  const isVisited = (id: string) => statusOf(entries, id) === 'visited';
  const visitedParks = PARKS.filter((p) => isVisited(p.id));

  const divisions: DivisionStat[] = [];
  for (const league of LEAGUES) {
    for (const division of DIVISIONS) {
      const parks = PARKS.filter((p) => p.league === league && p.division === division);
      const visited = parks.filter((p) => isVisited(p.id)).length;
      divisions.push({
        key: `${league}-${division}`,
        league,
        division,
        visited,
        total: parks.length,
        swept: visited === parks.length,
        parkIds: parks.map((p) => p.id),
      });
    }
  }

  const count = (ids: string[]) => ids.filter(isVisited).length;
  const crosstownPairs = CROSSTOWN.filter(([a, b]) => isVisited(a) && isVisited(b)).length;
  const sweeps = divisions.filter((d) => d.swept).length;

  const badges: Badge[] = [
    { id: 'opening-day', name: 'Opening Day', description: 'Log your first ballpark.', earned: visitedParks.length >= 1, have: Math.min(1, visitedParks.length), total: 1 },
    { id: 'double-digits', name: 'Double Digits', description: 'Visit 10 ballparks.', earned: visitedParks.length >= 10, have: Math.min(10, visitedParks.length), total: 10 },
    { id: 'pacific-coast', name: 'Pacific Coast', description: 'Visit all six West Coast parks: SD, Anaheim, LA, SF, Sacramento and Seattle.', earned: count(PACIFIC) === PACIFIC.length, have: count(PACIFIC), total: PACIFIC.length },
    { id: 'golden-era', name: 'Golden Era', description: 'Visit the five oldest parks: Fenway, Wrigley, Dodger, Angel and Kauffman.', earned: count(GOLDEN) === GOLDEN.length, have: count(GOLDEN), total: GOLDEN.length },
    { id: 'crosstown', name: 'Crosstown Rivalries', description: 'Complete a crosstown pair: Yankees/Mets, Cubs/White Sox or Dodgers/Angels.', earned: crosstownPairs >= 1, have: crosstownPairs, total: CROSSTOWN.length },
    { id: 'i95', name: 'I-95 Rider', description: 'Hit all six parks on the Boston-to-DC corridor.', earned: count(I95) === I95.length, have: count(I95), total: I95.length },
    { id: 'rust-belt', name: 'Rust Belt Run', description: 'Visit Cleveland, Detroit, Pittsburgh, Cincinnati and St. Louis.', earned: count(RUST) === RUST.length, have: count(RUST), total: RUST.length },
    { id: 'north-of-border', name: 'Great White North', description: 'Cross the border to Rogers Centre.', earned: isVisited('tor'), have: isVisited('tor') ? 1 : 0, total: 1 },
    { id: 'mile-high', name: 'Mile High Club', description: 'Watch a ball carry at Coors Field.', earned: isVisited('col'), have: isVisited('col') ? 1 : 0, total: 1 },
    { id: 'division-sweeper', name: 'Division Sweeper', description: 'Sweep every park in any division.', earned: sweeps >= 1, have: Math.min(1, sweeps), total: 1 },
    { id: 'league-leader', name: 'Both Leagues', description: 'Sweep one division in each league.', earned: new Set(divisions.filter((d) => d.swept).map((d) => d.league)).size === 2, have: new Set(divisions.filter((d) => d.swept).map((d) => d.league)).size, total: 2 },
    { id: 'complete-game', name: 'Complete Game', description: 'Visit all 30 ballparks.', earned: visitedParks.length === PARKS.length, have: visitedParks.length, total: PARKS.length },
  ];

  return {
    visited: visitedParks.length,
    wishlist: PARKS.filter((p) => statusOf(entries, p.id) === 'wishlist').length,
    total: PARKS.length,
    al: visitedParks.filter((p) => p.league === 'AL').length,
    nl: visitedParks.filter((p) => p.league === 'NL').length,
    alTotal: PARKS.filter((p) => p.league === 'AL').length,
    nlTotal: PARKS.filter((p) => p.league === 'NL').length,
    divisions,
    sweeps,
    badges,
    earnedBadges: badges.filter((b) => b.earned),
  };
}
