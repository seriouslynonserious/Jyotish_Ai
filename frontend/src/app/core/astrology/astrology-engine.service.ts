import { Injectable } from '@angular/core';
import type { BirthChart, BirthData, LongitudeResult, PlanetPosition } from './astrology.models';
import { calculateKetu, calculateZodiac } from './zodiac.util';
import { describeSiderealLongitude } from './astrology.dev';
import { EphemerisService } from './ephemeris.service';
import { calculateWholeSignHouses } from './house.util';
import { calculateVimshottari } from './dasha.util';
import { birthTimeToUtc } from './birth-time.util';

@Injectable({ providedIn: 'root' })
export class AstrologyEngineService {
  constructor(private readonly ephemeris: EphemerisService) {}

  describeLongitude(siderealLongitude: number): LongitudeResult {
    return describeSiderealLongitude(siderealLongitude);
  }

  ketuFromRahu(rahuSiderealLongitude: number): LongitudeResult {
    return describeSiderealLongitude(calculateKetu(rahuSiderealLongitude));
  }

  async calculateBirthChart(data: BirthData): Promise<BirthChart> {
    const utcBirthTime = birthTimeToUtc(data);
    const result = await this.ephemeris.calculate(utcBirthTime);
    const planets: PlanetPosition[] = result.positions.map((position) => ({
      ...position,
      ...calculateZodiac(position.siderealLongitude),
    }));
    const moon = planets.find((position) => position.planet === 'Moon')!;
    const ascendant = await this.ephemeris.calculateAscendant(result.julianDayUt, data.latitude, data.longitude);
    return {
      houses: ascendant === null ? null : calculateWholeSignHouses(ascendant, planets),
      dashas: calculateVimshottari(moon.siderealLongitude, utcBirthTime),
      utcBirthTime,
      julianDayUt: result.julianDayUt,
      ayanamsha: result.ayanamsha,
      ayanamshaSystem: 'Lahiri',
      ephemeris: 'Swiss Ephemeris / Moshier',
      planets,
      moon: describeSiderealLongitude(moon.siderealLongitude),
      nodeType: 'MEAN_NODE',
      limitations: [
        'Built-in Moshier ephemeris; no Swiss/JPL ephemeris data files are loaded.',
        'Coordinates affect Lagna and houses; planetary positions remain geocentric.',
        ...(ascendant === null ? ['Lagna and houses: Not calculated yet for latitudes at or beyond 66° north/south.'] : []),
        'Historical time accuracy depends on IANA timezone data and Swiss Ephemeris time models.',
        'Chart calculations are available; interpretations and predictions are not.',
      ],
    };
  }
}
