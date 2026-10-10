export interface RoadCell {
  hours: number;
  miles: number;
}

export interface RoadMatrix {
  ids: string[];
  /** cells[i][j] is the driving cost from ids[i] to ids[j], or null when no road route exists. */
  cells: (RoadCell | null)[][];
}

interface OsrmTable {
  code: string;
  durations?: (number | null)[][];
  distances?: (number | null)[][];
}

const METERS_PER_MILE = 1609.344;
let cached: { key: string; matrix: RoadMatrix } | null = null;

/**
 * One call to the public OSRM table service returns real road durations and distances between every pair of points.
 * Returns null if the service is unavailable so callers can fall back to estimates.
 */
export async function fetchRoadMatrix(points: { id: string; coordinates: [number, number] }[], signal?: AbortSignal): Promise<RoadMatrix | null> {
  const key = points.map((p) => `${p.id}@${p.coordinates[0].toFixed(3)},${p.coordinates[1].toFixed(3)}`).join('|');
  if (cached?.key === key) return cached.matrix;

  const coords = points.map((p) => `${p.coordinates[0]},${p.coordinates[1]}`).join(';');
  try {
    const res = await fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration,distance`, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as OsrmTable;
    if (json.code !== 'Ok' || !json.durations || !json.distances) return null;
    const cells = json.durations.map((row, i) =>
      row.map((seconds, j) => {
        const meters = json.distances?.[i]?.[j];
        if (seconds == null || meters == null) return null;
        return { hours: seconds / 3600, miles: meters / METERS_PER_MILE };
      }),
    );
    const matrix: RoadMatrix = { ids: points.map((p) => p.id), cells };
    cached = { key, matrix };
    return matrix;
  } catch {
    return null;
  }
}
