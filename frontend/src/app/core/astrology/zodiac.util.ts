import type { ZodiacResult } from './astrology.models';

export const ZODIAC_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

export function normalizeLongitude(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Longitude must be a finite number.');
  const remainder = value % 360;
  // Avoid adding 360 to positive values, which can lose precision.
  const normalized = remainder < 0 ? remainder + 360 : remainder;
  return normalized === 0 || normalized === 360 ? 0 : normalized;
}

export function calculateZodiac(value: number): ZodiacResult {
  const longitude = normalizeLongitude(value);
  const index = Math.floor(longitude / 30);
  return { sign: ZODIAC_SIGNS[index], degreeInSign: longitude - index * 30 };
}

export function calculateKetu(rahuLongitude: number): number {
  return normalizeLongitude(normalizeLongitude(rahuLongitude) + 180);
}
