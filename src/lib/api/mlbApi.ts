export interface GameResult {
  gamePk: number;
  date: string;
  opponent: string;
  opponentAbbr: string;
  homeAbbr: string;
  awayAbbr: string;
  homeScore: number;
  awayScore: number;
  finalScore: string;
  winningPitcher: string;
  losingPitcher: string;
  status: string;
  isFinal: boolean;
  gameNumber: number;
}

interface ScheduleTeam {
  team: { id: number; name: string; abbreviation?: string };
  score?: number;
}

interface ScheduleGame {
  gamePk: number;
  gameNumber?: number;
  status?: { detailedState?: string; abstractGameState?: string };
  teams: { home: ScheduleTeam; away: ScheduleTeam };
  decisions?: { winner?: { fullName?: string }; loser?: { fullName?: string } };
}

interface ScheduleResponse {
  dates?: { date: string; games: ScheduleGame[] }[];
}

const cache = new Map<string, GameResult[]>();

/**
 * Fetches the home games a team played on a date (doubleheaders return two).
 * Uses the free, key-less MLB Stats API.
 */
export async function fetchHomeGames(teamId: number, date: string, signal?: AbortSignal): Promise<GameResult[]> {
  const key = `${teamId}:${date}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&teamId=${teamId}&hydrate=team,decisions`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`MLB Stats API responded ${res.status}`);
  const json = (await res.json()) as ScheduleResponse;

  const games: GameResult[] = [];
  for (const day of json.dates ?? []) {
    for (const g of day.games) {
      if (g.teams.home.team.id !== teamId) continue;
      const { home, away } = g.teams;
      const homeScore = home.score ?? 0;
      const awayScore = away.score ?? 0;
      const homeAbbr = home.team.abbreviation ?? home.team.name;
      const awayAbbr = away.team.abbreviation ?? away.team.name;
      const isFinal = g.status?.abstractGameState === 'Final';
      games.push({
        gamePk: g.gamePk,
        date: day.date,
        opponent: away.team.name,
        opponentAbbr: awayAbbr,
        homeAbbr,
        awayAbbr,
        homeScore,
        awayScore,
        finalScore: isFinal ? `${awayAbbr} ${awayScore}, ${homeAbbr} ${homeScore}` : '',
        winningPitcher: g.decisions?.winner?.fullName ?? '',
        losingPitcher: g.decisions?.loser?.fullName ?? '',
        status: g.status?.detailedState ?? 'Scheduled',
        isFinal,
        gameNumber: g.gameNumber ?? 1,
      });
    }
  }
  if (games.length) cache.set(key, games);
  return games;
}
