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

export interface BirthChartResult {
  profile: BirthProfile;
  status: 'Not calculated yet';
}
