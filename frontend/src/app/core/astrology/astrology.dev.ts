import type { LongitudeResult } from './astrology.models';
import { calculateNakshatra } from './nakshatra.util';
import { calculateZodiac, normalizeLongitude } from './zodiac.util';

// Input must already be SIDEREAL. This does not calculate a planet's position.
export function describeSiderealLongitude(value: number): LongitudeResult {
  const longitude = normalizeLongitude(value);
  return { longitude, ...calculateZodiac(longitude), ...calculateNakshatra(longitude) };
}

// Temporary developer entry point: change the argument to try another longitude.
export function testLongitude(longitude = 311.5): LongitudeResult {
  return describeSiderealLongitude(longitude);
}
