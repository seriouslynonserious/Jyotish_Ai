import { Injectable } from '@angular/core';
import type { BirthChartResult, BirthProfile, LongitudeResult } from './astrology.models';
import { calculateKetu } from './zodiac.util';
import { describeSiderealLongitude } from './astrology.dev';

@Injectable({ providedIn: 'root' })
export class AstrologyEngineService {
  describeLongitude(siderealLongitude: number): LongitudeResult {
    return describeSiderealLongitude(siderealLongitude);
  }

  ketuFromRahu(rahuSiderealLongitude: number): LongitudeResult {
    return describeSiderealLongitude(calculateKetu(rahuSiderealLongitude));
  }

  calculateBirthChart(profile: BirthProfile): BirthChartResult {
    // Birth details alone are not converted into invented planetary positions.
    return { profile: { ...profile }, status: 'Not calculated yet' };
  }
}
