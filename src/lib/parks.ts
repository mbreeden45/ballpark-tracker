import data from '../../data/ballparks.json';
import type { Ballpark } from './types';

export const PARKS: Ballpark[] = data as Ballpark[];

const byId = new Map(PARKS.map((p) => [p.id, p]));

export function getPark(id: string): Ballpark | undefined {
  return byId.get(id);
}

export function requirePark(id: string): Ballpark {
  const park = byId.get(id);
  if (!park) throw new Error(`Unknown ballpark: ${id}`);
  return park;
}
