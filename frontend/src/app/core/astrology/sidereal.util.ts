import { normalizeLongitude } from './zodiac.util';

// Caller must supply a reliable, date-specific ayanamsha in the same frame.
export function tropicalToSidereal(tropicalLongitude: number, ayanamsha: number): number {
  return normalizeLongitude(normalizeLongitude(tropicalLongitude) - normalizeLongitude(ayanamsha));
}
