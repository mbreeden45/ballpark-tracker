import { PARKS } from './parks';
import { haversineMiles } from './utils';
import type { Ballpark } from './types';

export interface Corridor {
  id: string;
  name: string;
  blurb: string;
  color: string;
  parkIds: string[];
}

export interface CorridorLeg {
  corridorId: string;
  from: Ballpark;
  to: Ballpark;
  miles: number;
  color: string;
}

export const CORRIDORS: Corridor[] = [
  {
    id: 'california',
    name: 'California Corridor',
    blurb: 'Pacific Coast Highway & I-5, San Diego to Sacramento',
    color: '#BF0D3E',
    parkIds: ['sd', 'laa', 'lad', 'sf', 'ath'],
  },
  {
    id: 'i95',
    name: 'I-95 Northeast',
    blurb: 'Fenway to the Beltway along the Amtrak spine',
    color: '#041E42',
    parkIds: ['bos', 'nym', 'nyy', 'phi', 'bal', 'wsh'],
  },
  {
    id: 'midwest',
    name: 'Midwest Circuit',
    blurb: 'Great Lakes and river-city loop from the Twin Cities',
    color: '#2F80ED',
    parkIds: ['min', 'mil', 'cws', 'chc', 'det', 'cle', 'cin', 'stl', 'kc'],
  },
];

/** Driving distance estimate: great-circle miles scaled by a typical road circuity factor. */
const ROAD_FACTOR = 1.18;

export function drivingMiles(a: Ballpark, b: Ballpark): number {
  return Math.max(1, Math.round(haversineMiles(a.coordinates, b.coordinates) * ROAD_FACTOR));
}

export function corridorLegs(corridor: Corridor): CorridorLeg[] {
  const parks = corridor.parkIds
    .map((id) => PARKS.find((p) => p.id === id))
    .filter((p): p is Ballpark => Boolean(p));
  const legs: CorridorLeg[] = [];
  for (let i = 0; i < parks.length - 1; i++) {
    legs.push({
      corridorId: corridor.id,
      from: parks[i],
      to: parks[i + 1],
      miles: drivingMiles(parks[i], parks[i + 1]),
      color: corridor.color,
    });
  }
  return legs;
}
