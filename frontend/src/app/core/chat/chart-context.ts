import { BirthChart } from '../astrology/astrology.models';

// Keep the exact calculated values needed for interpretation, without sending
// every past/future subperiod or duplicate tropical coordinates on every turn.
export function chartContext(chart: BirthChart, asOf = new Date()) {
  const time = asOf.getTime();
  if (!Number.isFinite(time)) throw new RangeError('Invalid reference date.');
  const major = chart.dashas.find(p => Date.parse(p.start) <= time && time < Date.parse(p.end));
  const minor = major?.antardashas.find(p => Date.parse(p.start) <= time && time < Date.parse(p.end));
  return {
    asOfUtc: asOf.toISOString(),
    ayanamshaSystem: chart.ayanamshaSystem,
    nodeType: chart.nodeType,
    planets: chart.planets.map(({ planet, sign, degreeInSign }) => ({
      planet, sign, degreeInSign,
      house: chart.houses?.houses.find(house => house.planets.includes(planet))?.number ?? null,
    })),
    moon: chart.moon,
    houses: chart.houses,
    currentMahadasha: major ? { lord: major.lord, start: major.start, end: major.end } : null,
    currentAntardasha: minor ?? null,
    majorPeriods: chart.dashas.map(({ lord, start, end }) => ({ lord, start, end })),
    currentMajorSubperiods: major?.antardashas ?? [],
    limitations: [...chart.limitations, 'Other major-period subperiods are not supplied. Transits are not calculated.'],
  };
}
