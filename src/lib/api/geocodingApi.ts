export interface Place {
  id: number;
  name: string;
  region: string;
  country: string;
  coordinates: [number, number];
  label: string;
}

interface GeoResponse {
  results?: { id: number; name: string; latitude: number; longitude: number; admin1?: string; country_code?: string }[];
}

/** City search using the free, key-less Open-Meteo geocoding service. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as GeoResponse;
  return (json.results ?? [])
    .filter((r) => r.country_code === 'US' || r.country_code === 'CA')
    .map((r) => ({
      id: r.id,
      name: r.name,
      region: r.admin1 ?? '',
      country: r.country_code ?? '',
      coordinates: [r.longitude, r.latitude] as [number, number],
      label: [r.name, r.admin1].filter(Boolean).join(', '),
    }));
}
