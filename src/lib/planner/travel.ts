import { PARKS } from '../parks';
import { fetchRoadMatrix, type RoadMatrix } from '../api/routingApi';
import { haversineMiles } from '../utils';
import type { HomePoint, Leg } from './types';

export const HOME_ID = 'home';

export interface Travel {
  roadDataUsed: boolean;
  /** Raw driving cost between two node ids (parks or HOME_ID). */
  drive: (a: string, b: string) => { hours: number; miles: number; source: 'road' | 'estimate' };
  label: (id: string) => string;
  coordinates: (id: string) => [number, number];
}

const ROAD_CIRCUITY = 1.2;
const AVG_MPH = 55;

/** Door-to-door flight estimate: airport and transfer overhead plus air time at cruise speed. */
export function flightHours(greatCircleMiles: number): number {
  return 3.5 + greatCircleMiles / 480;
}

export async function buildTravel(home: HomePoint | null, signal?: AbortSignal): Promise<Travel> {
  const nodes = [
    ...(home ? [{ id: HOME_ID, coordinates: home.coordinates, label: home.label }] : []),
    ...PARKS.map((p) => ({ id: p.id, coordinates: p.coordinates, label: p.venue })),
  ];
  const road: RoadMatrix | null = await fetchRoadMatrix(nodes.map((n) => ({ id: n.id, coordinates: n.coordinates })), signal);
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return {
    roadDataUsed: road !== null,
    drive: (a, b) => {
      const i = index.get(a);
      const j = index.get(b);
      if (road && i !== undefined && j !== undefined) {
        const cell = road.cells[i]?.[j];
        if (cell) return { hours: cell.hours, miles: cell.miles, source: 'road' };
      }
      const from = byId.get(a);
      const to = byId.get(b);
      const miles = from && to ? haversineMiles(from.coordinates, to.coordinates) * ROAD_CIRCUITY : 0;
      return { hours: miles / AVG_MPH, miles, source: 'estimate' };
    },
    label: (id) => byId.get(id)?.label ?? id,
    coordinates: (id) => byId.get(id)?.coordinates ?? [0, 0],
  };
}

/**
 * Chooses how to get between two nodes. Drives when within the user's per-leg limit, flies when allowed and
 * quicker, and otherwise reports the trip as impossible (null).
 */
export function chooseLeg(travel: Travel, a: string, b: string, maxDriveHours: number, allowFlying: boolean): Leg | null {
  const road = travel.drive(a, b);
  if (road.hours <= maxDriveHours) {
    return { mode: 'drive', hours: road.hours, miles: road.miles, fromLabel: travel.label(a), source: road.source };
  }
  if (allowFlying) {
    const gc = haversineMiles(travel.coordinates(a), travel.coordinates(b));
    const hours = flightHours(gc);
    if (hours <= 9) return { mode: 'fly', hours, miles: gc, fromLabel: travel.label(a), source: 'estimate' };
  }
  return null;
}

/** Like chooseLeg but always returns something; used for the trip home where no limit applies. */
export function returnLeg(travel: Travel, a: string, b: string, maxDriveHours: number, allowFlying: boolean): Leg {
  const picked = chooseLeg(travel, a, b, maxDriveHours, allowFlying);
  if (picked) return picked;
  const road = travel.drive(a, b);
  return { mode: 'drive', hours: road.hours, miles: road.miles, fromLabel: travel.label(a), source: road.source };
}
