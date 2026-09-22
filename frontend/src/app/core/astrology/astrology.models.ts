export interface BirthProfile {
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}

export type Pada = 1 | 2 | 3 | 4;

export interface ZodiacResult {
  sign: string;
  degreeInSign: number;
}

export interface NakshatraResult {
  nakshatra: string;
  pada: Pada;
}

export interface LongitudeResult extends ZodiacResult, NakshatraResult {
  longitude: number;
}

export interface BirthData {
  dateOfBirth: string;
  timeOfBirth: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export type Planet =
  'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Rahu' | 'Ketu';
export type NotCalculated = 'Not calculated yet';

export interface PlanetPosition {
  planet: Planet;
  tropicalLongitude: number;
  siderealLongitude: number;
  sign: string;
  degreeInSign: number;
}

export interface BirthChart {
  utcBirthTime: string;
  ayanamsha: number;
  ayanamshaSystem: 'Lahiri';
  planets: PlanetPosition[];
  moon: LongitudeResult;
  nodeType: 'MEAN_NODE';
  ephemeris: 'Swiss Ephemeris / Moshier';
  julianDayUt: number;
  houses: HouseChart | null;
  dashas: DashaPeriod[];
  limitations: string[];
}

export interface HouseChart {
  ascendant: number;
  sign: string;
  degreeInSign: number;
  houses: { number: number; longitude: number; sign: string; planets: Planet[] }[];
}

export interface DashaPeriod {
  lord: Planet;
  start: string;
  end: string;
  antardashas: { lord: Planet; start: string; end: string }[];
}
