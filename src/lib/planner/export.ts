import type { Itinerary } from './types';
import { formatLocalTime } from './engine';
import { formatDate } from '../utils';

const HOUR = 3_600_000;

function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function itineraryToIcs(it: Itinerary): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ballpark Passport//Trip Planner//EN', 'CALSCALE:GREGORIAN'];
  it.stops.forEach((s) => {
    const g = s.game;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${g.gamePk}@ballpark-passport`,
      `DTSTAMP:${icsDate(Date.now())}`,
      `DTSTART:${icsDate(g.startUtc)}`,
      `DTEND:${icsDate(g.startUtc + 3 * HOUR)}`,
      `SUMMARY:${esc(`${g.awayName} at ${g.homeName}`)}`,
      `LOCATION:${esc(`${s.park.venue}, ${s.park.city}, ${s.park.state}`)}`,
      `DESCRIPTION:${esc(s.leg ? `Travel: ${s.leg.mode === 'drive' ? 'drive' : 'flight'} about ${s.leg.hours.toFixed(1)} h from ${s.leg.fromLabel}` : 'First game of the trip')}`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function itineraryToText(it: Itinerary): string {
  const rows = it.stops.map((s, i) => {
    const g = s.game;
    const when = `${formatDate(g.date, { weekday: 'short', month: 'short', day: 'numeric' })} ${formatLocalTime(g.startUtc, s.park.timeZone)}`;
    const travel = s.leg ? ` (${it.hub ? 'day trip, ' : ''}${s.leg.mode === 'drive' ? 'drive' : 'flight'} ${s.leg.hours.toFixed(1)} h${it.hub ? ' each way' : ''}, ${Math.round(s.leg.miles)} mi)` : '';
    return `${i + 1}. ${when}: ${g.awayName} at ${g.homeName}, ${s.park.venue}${travel}`;
  });
  return [`Ballpark trip: ${it.newParks} new parks, ${it.totalMiles.toLocaleString()} miles`, ...rows].join('\n');
}
