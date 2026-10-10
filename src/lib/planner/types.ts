import type { HomeGame } from '../api/scheduleApi';
import type { Ballpark } from '../types';

export interface HomePoint {
  label: string;
  coordinates: [number, number];
}

export interface PlannerOptions {
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
  visited: ReadonlySet<string>;
  wishlist: ReadonlySet<string>;
}

export type TravelMode = 'drive' | 'fly';

export interface Leg {
  mode: TravelMode;
  hours: number;
  miles: number;
  fromLabel: string;
  source: 'road' | 'estimate';
}

export interface Stop {
  game: HomeGame;
  park: Ballpark;
  /** Travel from the previous stop (or from home for the first stop). */
  leg: Leg | null;
  isNew: boolean;
  isWishlist: boolean;
  preferredHome: boolean;
  preferredAway: boolean;
  warnings: string[];
}

export interface Itinerary {
  id: string;
  tag: string;
  stops: Stop[];
  returnLeg: Leg | null;
  newParks: number;
  totalMiles: number;
  travelHours: number;
  flights: number;
  preferredGames: number;
  score: number;
  missingMust: string[];
}

export interface PlanResult {
  itineraries: Itinerary[];
  gamesConsidered: number;
  roadDataUsed: boolean;
}
