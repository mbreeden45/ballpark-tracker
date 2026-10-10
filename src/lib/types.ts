export type League = 'AL' | 'NL';
export type Division = 'East' | 'Central' | 'West';
export type ParkStatus = 'unvisited' | 'wishlist' | 'visited';
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';
export type MapMode = 'vintage' | 'satellite' | 'corridor';
export type ListMode = 'binder' | 'scoreboard' | 'passport' | 'tierlist';

export interface Ballpark {
  id: string;
  mlbId: number;
  abbr: string;
  franchise: string;
  teamName: string;
  venue: string;
  city: string;
  state: string;
  coordinates: [number, number];
  league: League;
  division: Division;
  openedYear: number;
  capacity: number;
  turfType: string;
  primaryColor: string;
  secondaryColor: string;
  localClassicConcession: string;
}

export interface Ratings {
  sightlines: number;
  atmosphere: number;
  concessions: number;
  beerSelection: number;
  history: number;
}

export type RatingKey = keyof Ratings;

export interface VisitRecord {
  dateVisited: string;
  opponent: string;
  finalScore: string;
  seatSection: string;
  winningPitcher: string;
  losingPitcher: string;
}

export interface ParkNotes {
  standoutFood: string;
  craftBeerNotes: string;
  glutenFreeNotes: string;
  personalMemory: string;
}

export interface ParkEntry {
  status: ParkStatus;
  visit: VisitRecord;
  ratings: Ratings;
  notes: ParkNotes;
  tier: Tier | null;
}

export const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D'];

export const RATING_LABELS: { key: RatingKey; label: string; hint: string }[] = [
  { key: 'sightlines', label: 'Sightlines', hint: 'Views of the diamond & skyline' },
  { key: 'atmosphere', label: 'Atmosphere', hint: 'Crowd, noise, energy' },
  { key: 'concessions', label: 'Concessions', hint: 'Food variety & quality' },
  { key: 'beerSelection', label: 'Beer Selection', hint: 'Craft taps & local pours' },
  { key: 'history', label: 'History / Nostalgia', hint: 'Character & ghosts of the game' },
];

export function emptyEntry(): ParkEntry {
  return {
    status: 'unvisited',
    visit: { dateVisited: '', opponent: '', finalScore: '', seatSection: '', winningPitcher: '', losingPitcher: '' },
    ratings: { sightlines: 0, atmosphere: 0, concessions: 0, beerSelection: 0, history: 0 },
    notes: { standoutFood: '', craftBeerNotes: '', glutenFreeNotes: '', personalMemory: '' },
    tier: null,
  };
}
