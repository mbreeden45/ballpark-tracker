import { getPark } from './parks';
import { formatLocalTime } from './planner/engine';
import { formatDate } from './utils';
import type { CardData, ShareCardId } from './shareTypes';

/**
 * Text that travels with a shared image. Instagram ignores or rejects text in the share sheet, so this is
 * offered separately: attached for messages, and copyable for posts.
 */
export function buildCaption(card: ShareCardId, data: CardData, origin: string): string {
  const { stats } = data;
  const link = origin || 'ballpark-tracker.vercel.app';

  if (card === 'trip' && data.trip) {
    const it = data.trip.itinerary;
    const lines = it.stops.map((s, i) => {
      const g = s.game;
      const when = `${formatDate(g.date, { weekday: 'short', month: 'short', day: 'numeric' })}, ${formatLocalTime(g.startUtc, s.park.timeZone)}`;
      return `${i + 1}. ${when}: ${g.awayName} at ${g.homeName} (${s.park.venue}, ${s.park.city})`;
    });
    return [
      `Baseball road trip! ${it.stops.length} games, ${it.newParks} new MLB ballparks, about ${it.totalMiles.toLocaleString()} miles.`,
      '',
      ...lines,
      '',
      `Want to come? Plan your own trip too: ${link}`,
    ].join('\n');
  }

  if (card === 'checkin' && data.parkId) {
    const park = getPark(data.parkId);
    if (park) return `Checked off ${park.venue}. That's ${stats.visited} of 30 MLB ballparks. Track yours with me: ${link}`;
  }

  if (card === 'challenge') {
    return `${stats.visited} down, ${stats.total - stats.visited} to go. How many of the 30 MLB ballparks have you hit? Track yours: ${link}`;
  }

  return `I've been to ${stats.visited} of 30 MLB ballparks. Track yours with me: ${link}`;
}
