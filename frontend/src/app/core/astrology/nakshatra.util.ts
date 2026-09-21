import type { NakshatraResult, Pada } from './astrology.models';
import { normalizeLongitude } from './zodiac.util';

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

export function calculateNakshatra(moonSiderealLongitude: number): NakshatraResult {
  const longitude = normalizeLongitude(moonSiderealLongitude);
  // 108 padas around the zodiac. Compare with boundaries instead of dividing
  // to avoid rounding an exact boundary down into the previous pada.
  let padaIndex = 0;
  for (let boundary = 1; boundary < 108; boundary++) {
    if (longitude < (boundary * 360) / 108) break;
    padaIndex = boundary;
  }
  return {
    nakshatra: NAKSHATRAS[Math.floor(padaIndex / 4)],
    pada: ((padaIndex % 4) + 1) as Pada,
  };
}
