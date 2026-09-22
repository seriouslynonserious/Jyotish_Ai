import type { DashaPeriod, Planet } from './astrology.models';
import { calculateNakshatra, NAKSHATRAS } from './nakshatra.util';
import { normalizeLongitude } from './zodiac.util';

// Explicit Julian-year convention, not calendar-year addition.
export const DASHA_YEAR_DAYS = 365.25;
const YEAR_MS = DASHA_YEAR_DAYS * 86400000;
const LORDS: readonly Planet[] = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

// Nine full major periods, starting with the period containing birth.
// Its true start may precede birth; subperiods are never restarted at birth.
export function calculateVimshottari(moonSiderealLongitude: number, utcBirthTime: string): DashaPeriod[] {
  const birth = Date.parse(utcBirthTime);
  if (!Number.isFinite(birth)) throw new RangeError('Invalid birth instant.');
  const longitude = normalizeLongitude(moonSiderealLongitude);
  const star = NAKSHATRAS.indexOf(calculateNakshatra(longitude).nakshatra as typeof NAKSHATRAS[number]);
  const first = star % 9;
  const fraction = (longitude - star * 360 / 27) / (360 / 27);
  let start = birth - fraction * YEARS[first] * YEAR_MS;
  const periods: DashaPeriod[] = [];
  for (let offset = 0; offset < 9; offset++) {
    const major = (first + offset) % 9;
    const duration = YEARS[major] * YEAR_MS;
    const end = start + duration;
    let elapsed = 0;
    const antardashas = Array.from({ length: 9 }, (_, sub) => {
      const minor = (major + sub) % 9;
      const subStart = start + duration * elapsed / 120;
      elapsed += YEARS[minor];
      return { lord: LORDS[minor], start: new Date(subStart).toISOString(), end: new Date(start + duration * elapsed / 120).toISOString() };
    });
    periods.push({ lord: LORDS[major], start: new Date(start).toISOString(), end: new Date(end).toISOString(), antardashas });
    start = end;
  }
  return periods;
}
