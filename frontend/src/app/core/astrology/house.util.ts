import type { HouseChart, PlanetPosition } from './astrology.models';
import { calculateZodiac, normalizeLongitude } from './zodiac.util';

export function calculateWholeSignHouses(ascendant: number, planets: PlanetPosition[]): HouseChart {
  ascendant = normalizeLongitude(ascendant);
  const firstSign = Math.floor(ascendant / 30);
  return {
    ascendant,
    ...calculateZodiac(ascendant),
    houses: Array.from({ length: 12 }, (_, index) => {
      const signIndex = (firstSign + index) % 12;
      const longitude = signIndex * 30;
      return {
        number: index + 1, longitude, sign: calculateZodiac(longitude).sign,
        planets: planets.filter(p => Math.floor(normalizeLongitude(p.siderealLongitude) / 30) === signIndex).map(p => p.planet),
      };
    }),
  };
}
