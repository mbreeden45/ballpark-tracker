export interface DayForecast {
  highF: number;
  lowF: number;
  rainPct: number;
  summary: string;
}

interface ForecastResponse {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    weathercode: number[];
  };
}

const cache = new Map<string, DayForecast | null>();
const FORECAST_DAYS = 15;

function describe(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Mostly sunny';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
}

/** True when Open-Meteo can forecast the given date (today through ~2 weeks out). */
export function isForecastable(date: string, today = new Date()): boolean {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const [y, m, d] = date.split('-').map(Number);
  const diff = Math.round((new Date(y, m - 1, d).getTime() - start) / 86400000);
  return diff >= 0 && diff <= FORECAST_DAYS;
}

export async function fetchForecast(lat: number, lng: number, date: string): Promise<DayForecast | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${date}&end_date=${date}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as ForecastResponse;
    const d = json.daily;
    if (!d || !d.time.length) return null;
    const out: DayForecast = {
      highF: Math.round(d.temperature_2m_max[0]),
      lowF: Math.round(d.temperature_2m_min[0]),
      rainPct: d.precipitation_probability_max[0] ?? 0,
      summary: describe(d.weathercode[0]),
    };
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}
