import { Injectable } from '@angular/core';
import type { SwissEph } from '@kuntay/swisseph';
import type { Planet } from './astrology.models';
import { calculateKetu, normalizeLongitude } from './zodiac.util';

export interface EphemerisResult {
  julianDayUt: number;
  ayanamsha: number;
  positions: { planet: Planet; tropicalLongitude: number; siderealLongitude: number }[];
}

// This narrow interface isolates the one Swiss C function not wrapped by the package.
interface SwissTimeApi {
  _malloc(bytes: number): number;
  _free(pointer: number): void;
  _swe_utc_to_jd(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    gregorian: number,
    result: number,
    error: number,
  ): number;
  getValue(pointer: number, type: 'double'): number;
  UTF8ToString(pointer: number): string;
}

@Injectable({ providedIn: 'root' })
export class EphemerisService {
  private instance?: Promise<SwissEph>;
  private library?: typeof import('@kuntay/swisseph');

  private load(): Promise<SwissEph> {
    // A failed download can be retried. All calculations after loading are synchronous,
    // so another chart cannot interleave changes to Swiss Ephemeris's global settings.
    return (this.instance ??= this.createInstance().catch((error) => {
      this.instance = undefined;
      throw error;
    }));
  }

  private async createInstance(): Promise<SwissEph> {
    // Serve the unmodified ESM/WASM package locally: its optional Node imports
    // must not be resolved by Angular's browser bundler.
    const moduleUrl =
      typeof document === 'undefined'
        ? '@kuntay/swisseph'
        : new URL('vendor/swisseph/dist/index.js', document.baseURI).href;
    this.library = await import(/* @vite-ignore */ moduleUrl);
    return this.library!.createSwissEph();
  }

  async calculate(utcBirthTime: string): Promise<EphemerisResult> {
    try {
      const date = new Date(utcBirthTime);
      if (!Number.isFinite(date.getTime())) throw new Error('Invalid UTC instant.');
      if (date.getUTCFullYear() < 1700 || date.getUTCFullYear() > 2100) {
        throw new Error('Supported birth dates are 1700–2100.');
      }
      const swiss = await this.load();
      const raw = swiss.raw as unknown as SwissTimeApi;
      const result = raw._malloc(16);
      const error = raw._malloc(256);
      let julianDayUt: number;
      try {
        const status = raw._swe_utc_to_jd(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
          date.getUTCHours(),
          date.getUTCMinutes(),
          date.getUTCSeconds() + date.getUTCMilliseconds() / 1000,
          1,
          result,
          error,
        );
        if (status < 0) throw new Error(raw.UTF8ToString(error));
        // Result[0] is TT, result[1] is UT1. calc() calls swe_calc_ut, so use UT1.
        julianDayUt = raw.getValue(result + 8, 'double');
      } finally {
        raw._free(result);
        raw._free(error);
      }
      return this.readPositions(swiss, julianDayUt);
    } catch (error) {
      throw new Error(
        `Ephemeris calculation failure: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Explicit UT1 entry point for comparison with published native-C fixtures.
  async positionsAtUt(julianDayUt: number): Promise<EphemerisResult> {
    if (!Number.isFinite(julianDayUt) || julianDayUt < 2341972.5 || julianDayUt >= 2488434.5) {
      throw new RangeError('Julian date must be within 1700–2100.');
    }
    return this.readPositions(await this.load(), julianDayUt);
  }

  async calculateAscendant(julianDayUt: number, latitude: number, longitude: number): Promise<number | null> {
    if (!Number.isFinite(julianDayUt) || julianDayUt < 2341972.5 || julianDayUt >= 2488434.5 ||
        !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
      throw new RangeError('Invalid house calculation input.');
    }
    // Polar rising-point conventions are outside this version's verified scope.
    if (Math.abs(latitude) >= 66) return null;
    const swiss = await this.load();
    swiss.setSiderealMode(this.library!.Ayanamsa.Lahiri);
    const result = swiss.houses(julianDayUt, latitude, longitude, 'W', { flags: this.library!.Flag.Sidereal });
    if (result.substituted || !Number.isFinite(result.ascendant)) return null;
    return normalizeLongitude(result.ascendant);
  }

  private readPositions(swiss: SwissEph, julianDayUt: number): EphemerisResult {
    const { Ayanamsa, Body, Flag } = this.library!;
    const BODIES = [
      ['Sun', Body.Sun],
      ['Moon', Body.Moon],
      ['Mercury', Body.Mercury],
      ['Venus', Body.Venus],
      ['Mars', Body.Mars],
      ['Jupiter', Body.Jupiter],
      ['Saturn', Body.Saturn],
      ['Rahu', Body.MeanNode],
    ] as const;
    swiss.setSiderealMode(Ayanamsa.Lahiri);
    // ex_ut includes nutation, matching the apparent tropical longitudes below.
    const ayanamsha = normalizeLongitude(swiss.ayanamsa(julianDayUt, 'moshier'));
    const positions: EphemerisResult['positions'] = BODIES.map(([planet, body]) => {
      const tropical = swiss.calc(julianDayUt, body, { ephemeris: 'moshier' });
      const sidereal = swiss.calc(julianDayUt, body, {
        ephemeris: 'moshier',
        flags: Flag.Sidereal,
      });
      if (tropical.ephemeris !== 'moshier' || sidereal.ephemeris !== 'moshier') {
        throw new Error('Unexpected ephemeris model.');
      }
      return {
        planet,
        tropicalLongitude: normalizeLongitude(tropical.longitude),
        siderealLongitude: normalizeLongitude(sidereal.longitude),
      };
    });
    const rahu = positions[7];
    positions.push({
      planet: 'Ketu',
      tropicalLongitude: calculateKetu(rahu.tropicalLongitude),
      siderealLongitude: calculateKetu(rahu.siderealLongitude),
    });
    return { julianDayUt, ayanamsha, positions };
  }
}
