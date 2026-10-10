interface ElevationResponse {
  elevation?: number[];
}

const cache = new Map<string, number>();
const METERS_TO_FEET = 3.28084;

/** Returns elevation in feet above sea level using the free Open-Meteo elevation endpoint. */
export async function fetchElevationFeet(lat: number, lng: number): Promise<number | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
    if (!res.ok) return null;
    const json = (await res.json()) as ElevationResponse;
    const meters = json.elevation?.[0];
    if (typeof meters !== 'number') return null;
    const feet = Math.round(meters * METERS_TO_FEET);
    cache.set(key, feet);
    return feet;
  } catch {
    return null;
  }
}
