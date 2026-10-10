import type { ParkEntry, Ratings } from './types';

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function averageRating(r: Ratings): number {
  const vals = Object.values(r).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function entryScore(e: ParkEntry): number {
  return averageRating(e.ratings);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function haversineMiles(a: [number, number], b: [number, number]): number {
  const R = 3958.8;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
