import type { Stats } from './stats';
import type { Itinerary, HomePoint } from './planner/types';
import type { ParkEntry } from './types';

export type ShareCardId = 'map' | 'grid' | 'number' | 'checkin' | 'milestone' | 'challenge' | 'trip' | 'set';
export type ShareFormat = 'story' | 'square';
export type ShareTheme = 'dark' | 'light';

export interface TripShare {
  itinerary: Itinerary;
  home: HomePoint | null;
}

/** What the share studio should open with. */
export interface ShareContext {
  card?: ShareCardId;
  parkId?: string;
  trip?: TripShare;
}

export interface ShareNudge {
  message: string;
  context: ShareContext;
}

export type Milestone =
  | { kind: 'complete' }
  | { kind: 'sweep'; label: string; parkIds: string[] }
  | { kind: 'count'; n: number };

export interface CardData {
  stats: Stats;
  entries: Record<string, ParkEntry | undefined>;
  host: string;
  lastVisitedId: string | null;
  parkId: string | null;
  /** Data URL of the photo shown on the check-in card (user photo or Wikipedia). */
  photo: string | null;
  qr: string | null;
  trip: TripShare | null;
  milestone: Milestone | null;
}

export const CARD_SIZE: Record<ShareFormat, { w: number; h: number }> = {
  story: { w: 360, h: 640 },
  square: { w: 360, h: 360 },
};
