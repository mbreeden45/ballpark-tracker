export interface VenueSummary {
  title: string;
  extract: string;
  photoUrl: string | null;
  thumbUrl: string | null;
  pageUrl: string | null;
}

interface WikiSummaryResponse {
  title?: string;
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  content_urls?: { desktop?: { page?: string } };
}

const cache = new Map<string, VenueSummary | null>();
const inflight = new Map<string, Promise<VenueSummary | null>>();

/** Rewrite a Wikimedia thumbnail URL (…/320px-File.jpg) to another width. Wikimedia only serves standard widths (500, 960, 1280…). */
function resizeThumb(src: string, width: number): string {
  return src.replace(/\/(\d+)px-/, `/${width}px-`);
}

export function getCachedVenueSummary(venue: string): VenueSummary | null | undefined {
  return cache.get(venue);
}

export async function fetchVenueSummary(venue: string): Promise<VenueSummary | null> {
  if (cache.has(venue)) return cache.get(venue) ?? null;
  const pending = inflight.get(venue);
  if (pending) return pending;

  const title = encodeURIComponent(venue.replace(/ /g, '_'));
  const request = (async () => {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}?redirect=true`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        cache.set(venue, null);
        return null;
      }
      const json = (await res.json()) as WikiSummaryResponse;
      const thumb = json.thumbnail?.source ?? null;
      const summary: VenueSummary = {
        title: json.title ?? venue,
        extract: json.extract ?? '',
        thumbUrl: thumb ? resizeThumb(thumb, 500) : null,
        photoUrl: thumb ? resizeThumb(thumb, 1280) : (json.originalimage?.source ?? null),
        pageUrl: json.content_urls?.desktop?.page ?? null,
      };
      cache.set(venue, summary);
      return summary;
    } catch {
      return null;
    } finally {
      inflight.delete(venue);
    }
  })();
  inflight.set(venue, request);
  return request;
}
