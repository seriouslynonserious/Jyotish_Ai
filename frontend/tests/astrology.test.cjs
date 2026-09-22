const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

// Compile the pure TypeScript utilities with the project's existing compiler.
const output = mkdtempSync(path.join(__dirname, '../.astrology-test-'));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve('typescript/bin/tsc'),
  'src/app/core/astrology/astrology.dev.ts',
  'src/app/core/astrology/sidereal.util.ts',
  'src/app/core/astrology/astrology-engine.service.ts',
  '--experimentalDecorators',
  '--outDir',
  output,
  '--module',
  'commonjs',
  '--target',
  'es2022',
  '--strict',
  '--skipLibCheck',
]);
const { normalizeLongitude, calculateZodiac, calculateKetu } = require(
  path.join(output, 'zodiac.util.js'),
);
const { calculateNakshatra } = require(path.join(output, 'nakshatra.util.js'));
const { testLongitude } = require(path.join(output, 'astrology.dev.js'));

const signs = [
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
];
const stars = [
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
];
const epsilon = 1e-8;

test('normalizes requested examples and rejects non-finite input', () => {
  for (const [value, expected] of [
    [0, 0],
    [29.999, 29.999],
    [30, 30],
    [359.999, 359.999],
    [360, 0],
    [361, 1],
    [-1, 359],
    [720, 0],
    [-360, 0],
  ]) {
    assert.equal(normalizeLongitude(value), expected);
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const calculate of [
      normalizeLongitude,
      calculateZodiac,
      calculateNakshatra,
      calculateKetu,
    ]) {
      assert.throws(() => calculate(value), RangeError);
    }
  }
});

for (let i = 0; i < 12; i++) {
  test(`zodiac boundary ${signs[i]}: before, exact, after`, () => {
    const boundary = i * 30;
    assert.deepEqual(calculateZodiac(boundary), { sign: signs[i], degreeInSign: 0 });
    assert.equal(calculateZodiac(boundary - epsilon).sign, signs[(i + 11) % 12]);
    assert.equal(calculateZodiac(boundary + epsilon).sign, signs[i]);
    assert.ok(Math.abs(calculateZodiac(boundary + 12.5).degreeInSign - 12.5) < epsilon);
  });
}

for (let i = 0; i < 27; i++) {
  test(`nakshatra boundary ${stars[i]}: before, exact, after`, () => {
    const boundary = (i * 360) / 27;
    assert.deepEqual(calculateNakshatra(boundary), { nakshatra: stars[i], pada: 1 });
    assert.deepEqual(calculateNakshatra(boundary - epsilon), {
      nakshatra: stars[(i + 26) % 27],
      pada: 4,
    });
    assert.deepEqual(calculateNakshatra(boundary + epsilon), { nakshatra: stars[i], pada: 1 });
  });
}

for (let i = 0; i < 108; i++) {
  test(`pada boundary ${i}: before, exact, after`, () => {
    const boundary = (i * 360) / 108;
    const expected = { nakshatra: stars[Math.floor(i / 4)], pada: (i % 4) + 1 };
    const previous = (i + 107) % 108;
    assert.deepEqual(calculateNakshatra(boundary), expected);
    assert.deepEqual(calculateNakshatra(boundary + epsilon), expected);
    assert.deepEqual(calculateNakshatra(boundary - epsilon), {
      nakshatra: stars[Math.floor(previous / 4)],
      pada: (previous % 4) + 1,
    });
  });
}

test('wraps zodiac and nakshatra inputs correctly', () => {
  assert.deepEqual(calculateZodiac(360), { sign: 'Aries', degreeInSign: 0 });
  assert.deepEqual(calculateZodiac(-1), { sign: 'Pisces', degreeInSign: 29 });
  assert.equal(calculateZodiac(29.999).sign, 'Aries');
  assert.equal(calculateZodiac(359.999).sign, 'Pisces');
  assert.deepEqual(calculateNakshatra(360), { nakshatra: 'Ashwini', pada: 1 });
  assert.deepEqual(calculateNakshatra(-1), { nakshatra: 'Revati', pada: 4 });
  assert.deepEqual(calculateNakshatra(359.999), { nakshatra: 'Revati', pada: 4 });
});

test('Ketu is opposite Rahu and normalized', () => {
  for (const [rahu, ketu] of [
    [0, 180],
    [180, 0],
    [311.5, 131.5],
    [360, 180],
    [-1, 179],
    [720, 180],
  ]) {
    assert.equal(calculateKetu(rahu), ketu);
  }
});

test('developer helper returns computed structured results', () => {
  assert.deepEqual(testLongitude(311.5), {
    longitude: 311.5,
    sign: 'Aquarius',
    degreeInSign: 11.5,
    nakshatra: 'Shatabhisha',
    pada: 2,
  });
  assert.deepEqual(testLongitude(0), {
    longitude: 0,
    sign: 'Aries',
    degreeInSign: 0,
    nakshatra: 'Ashwini',
    pada: 1,
  });
  assert.deepEqual(testLongitude(360), testLongitude(0));
});

const { birthTimeToUtc } = require(path.join(output, 'birth-time.util.js'));
const { tropicalToSidereal } = require(path.join(output, 'sidereal.util.js'));
const { EphemerisService } = require(path.join(output, 'ephemeris.service.js'));
const { AstrologyEngineService } = require(path.join(output, 'astrology-engine.service.js'));
const birth = {
  dateOfBirth: '2000-01-01',
  timeOfBirth: '12:00',
  latitude: 0,
  longitude: 0,
  timezone: 'UTC',
};
const ephemeris = new EphemerisService();
const engine = new AstrologyEngineService(ephemeris);

test('UTC conversion handles offsets, rollover, DST and historical offset seconds', () => {
  assert.equal(birthTimeToUtc(birth), '2000-01-01T12:00:00Z');
  assert.equal(
    birthTimeToUtc({ ...birth, timeOfBirth: '01:00', timezone: 'Asia/Kolkata' }),
    '1999-12-31T19:30:00Z',
  );
  assert.equal(
    birthTimeToUtc({ ...birth, dateOfBirth: '2024-07-01', timezone: 'America/New_York' }),
    '2024-07-01T16:00:00Z',
  );
  assert.equal(
    birthTimeToUtc({ ...birth, dateOfBirth: '2024-01-01', timezone: 'America/New_York' }),
    '2024-01-01T17:00:00Z',
  );
  // Paris used local mean time UTC+00:09:21 before March 1911 (IANA Europe/Paris).
  assert.equal(
    birthTimeToUtc({ ...birth, dateOfBirth: '1900-01-01', timezone: 'Europe/Paris' }),
    '1900-01-01T11:50:39Z',
  );
});

test('rejects nonexistent and ambiguous local times instead of guessing', () => {
  for (const [date, time] of [
    ['2024-03-10', '02:30'],
    ['2024-11-03', '01:30'],
  ]) {
    assert.throws(
      () =>
        birthTimeToUtc({
          ...birth,
          dateOfBirth: date,
          timeOfBirth: time,
          timezone: 'America/New_York',
        }),
      /ambiguous or does not exist/,
    );
  }
});

test('invalid birth inputs produce field-specific errors', async () => {
  for (const [field, value, message] of [
    ['dateOfBirth', '2023-02-29', 'DOB'],
    ['dateOfBirth', 'wrong', 'DOB'],
    ['timeOfBirth', '24:00', 'time'],
    ['timeOfBirth', '12:30:60', 'time'],
    ['timezone', 'Imaginary/City', 'timezone'],
    ['timezone', '+05:30', 'timezone'],
    ['latitude', 91, 'latitude'],
    ['latitude', NaN, 'latitude'],
    ['longitude', -181, 'longitude'],
    ['longitude', Infinity, 'longitude'],
  ])
    await assert.rejects(
      () => engine.calculateBirthChart({ ...birth, [field]: value }),
      new RegExp(message),
    );
  assert.doesNotThrow(() => birthTimeToUtc({ ...birth, latitude: -90, longitude: 180 }));
});

test('tropical-to-sidereal arithmetic accepts explicit test ayanamsha only', () => {
  assert.equal(tropicalToSidereal(10, 24), 346);
  assert.equal(tropicalToSidereal(360, 24), 336);
  assert.equal(tropicalToSidereal(54, 24), 30);
  assert.throws(() => tropicalToSidereal(30, NaN), RangeError);
});

test('real Lahiri chart maps sidereal positions and uses mean nodes', async () => {
  const chart = await engine.calculateBirthChart(birth);
  assert.equal(chart.planets.length,9);
  assert.equal(chart.nodeType,'MEAN_NODE');
  assert.equal(chart.ayanamshaSystem,'Lahiri');
  assert.equal(chart.ephemeris,'Swiss Ephemeris / Moshier');
  for (const planet of chart.planets) {
    assert.ok(planet.tropicalLongitude >= 0 && planet.tropicalLongitude < 360);
    assert.ok(planet.siderealLongitude >= 0 && planet.siderealLongitude < 360);
    assert.deepEqual({sign:planet.sign,degreeInSign:planet.degreeInSign},calculateZodiac(planet.siderealLongitude));
    assert.ok(Math.abs(tropicalToSidereal(planet.tropicalLongitude,chart.ayanamsha)-planet.siderealLongitude)<1e-8);
  }
  assert.equal(chart.moon.nakshatra,'Swati');
  assert.equal(chart.moon.pada,4);
  const rahu = chart.planets.find(p=>p.planet==='Rahu');
  const ketu = chart.planets.find(p=>p.planet==='Ketu');
  assert.equal(ketu.siderealLongitude,calculateKetu(rahu.siderealLongitude));
  assert.equal(ketu.tropicalLongitude,calculateKetu(rahu.tropicalLongitude));
  assert.deepEqual((await engine.calculateBirthChart({...birth,latitude:51,longitude:-1})).planets,chart.planets);
});

test('ephemeris rejects invalid inputs and unsupported dates', async () => {
  await assert.rejects(()=>ephemeris.calculate('wrong'),/Ephemeris calculation failure/);
  await assert.rejects(()=>engine.calculateBirthChart({...birth,dateOfBirth:'1600-01-01'}),/1700–2100/);
  await assert.rejects(()=>ephemeris.positionsAtUt(NaN),/Julian date/);
});

test('matches published opposition and equinox reference times', async () => {
  // Upstream reference fixtures, not values produced by this implementation.
  const reference = require('node:fs').readFileSync(
    path.join(__dirname, 'fixtures/opposition_2018.txt'),
    'utf8',
  );
  for (const line of reference.trim().split('\n')) {
    const [utc, name] = line.split(' ');
    if (!['Jupiter', 'Saturn', 'Mars'].includes(name)) continue;
    const positions = (await ephemeris.calculate(utc)).positions;
    const sun = positions.find((p) => p.planet === 'Sun').tropicalLongitude;
    const planet = positions.find((p) => p.planet === name).tropicalLongitude;
    assert.ok(Math.abs(normalizeLongitude(planet - sun) - 180) < 0.03, name);
  }
  // Upstream seasons.txt: 2024-03-20T03:06Z Equinox (minute precision).
  const sun = (await ephemeris.calculate('2024-03-20T03:06:00Z')).positions[0].tropicalLongitude;
  assert.ok(Math.abs(normalizeLongitude(sun + 180) - 180) < 0.02);
});

// Development-only inspection: no birth details or test UI are shipped into chat.
if (process.env.JYOTISH_BIRTH_FILE) {
  const data = JSON.parse(require('node:fs').readFileSync(process.env.JYOTISH_BIRTH_FILE, 'utf8'));
  test('inspect birth file',async()=>console.log(JSON.stringify(await engine.calculateBirthChart(data),null,2)));
}

const native = require('./fixtures/swiss-native.json');
const bodyNames = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'];
bodyNames[10]='Rahu';
for (const reference of native.cases) {
  test(`native reference ${reference.kind} JD ${reference.jd} body ${reference.body ?? '-'}`,async()=>{
    const result=await ephemeris.positionsAtUt(reference.jd);
    const actual=reference.kind==='ayanamsha' ? result.ayanamsha : result.positions.find(p=>p.planet===bodyNames[reference.body])[reference.kind==='tropical'?'tropicalLongitude':'siderealLongitude'];
    // Native tropical fixture explicitly uses Moshier. Native sidereal uses Swiss
    // files where available: allow the documented lunar model difference (3 arcsec).
    const tolerance=reference.kind==='sidereal'?0.002:reference.kind==='ayanamsha'?1e-7:1e-7;
    const error=Math.abs(normalizeLongitude(actual-reference.longitude+180)-180);
    assert.ok(error<tolerance,`difference ${error}°, tolerance ${tolerance}°`);
  });
}

test('date-specific Lahiri changes across centuries',async()=>{
  const first=await engine.calculateBirthChart({...birth,dateOfBirth:'1900-01-01'});
  const last=await engine.calculateBirthChart({...birth,dateOfBirth:'2100-01-01'});
  assert.ok(last.ayanamsha-first.ayanamsha>2.7);
  assert.ok(last.ayanamsha-first.ayanamsha<2.9);
});

const { calculateWholeSignHouses } = require(path.join(output, 'house.util.js'));
const { calculateVimshottari } = require(path.join(output, 'dasha.util.js'));
const houseReferences = require('./fixtures/houses-native.json');
for (const fixture of houseReferences.cases) {
  test(`native ascendant JD ${fixture.jd} at ${fixture.latitude},${fixture.longitude}`, async () => {
    const eph = new EphemerisService();
    const ascendant = await eph.calculateAscendant(fixture.jd, fixture.latitude, fixture.longitude);
    const positions = await eph.positionsAtUt(fixture.jd);
    const reconstructedTropical = normalizeLongitude(ascendant + positions.ayanamsha);
    const error = Math.abs(normalizeLongitude(reconstructedTropical - fixture.tropicalAscendant + 180) - 180);
    assert.ok(error < 0.000001, `native ascendant error ${error}`);
  });
}
for (let i = 0; i < 12; i++) {
  test(`whole-sign house boundary ${i * 30}`, () => {
    const positions = [{ planet: 'Sun', siderealLongitude: i * 30 }, { planet: 'Moon', siderealLongitude: normalizeLongitude(i * 30 - 0.00001) }];
    const chart = calculateWholeSignHouses(i * 30, positions);
    assert.equal(chart.houses[0].sign, signs[i]);
    assert.deepEqual(chart.houses[0].planets, ['Sun']);
    assert.deepEqual(chart.houses[11].planets, ['Moon']);
    assert.equal(chart.houses.length, 12);
    assert.equal(new Set(chart.houses.map(h => h.sign)).size, 12);
  });
}
test('polar houses remain unsupported; invalid coordinates reject', async () => {
  const eph = new EphemerisService();
  assert.equal(await eph.calculateAscendant(2451545, 90, 0), null);
  assert.equal(await eph.calculateAscendant(2451545, -66, 0), null);
  await assert.rejects(eph.calculateAscendant(2451545, 91, 0));
  await assert.rejects(eph.calculateAscendant(NaN, 0, 0));
  const chart = await engine.calculateBirthChart({...birth, latitude:90});
  assert.equal(chart.houses, null);
  assert.equal(chart.planets.length, 9);
});
test('Lagna changes with coordinates while planetary longitudes stay the same', async () => {
  const a = await engine.calculateBirthChart(birth);
  const b = await engine.calculateBirthChart({...birth,latitude:28.6,longitude:77.2});
  assert.notEqual(a.houses.ascendant, b.houses.ascendant);
  assert.deepEqual(a.planets,b.planets);
});
const dashaLords = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
for (let i = 0; i < 27; i++) {
  test(`Vimshottari nakshatra boundary ${i}`, () => {
    const periods = calculateVimshottari(i * 360 / 27, '2000-01-01T00:00:00Z');
    assert.equal(periods[0].lord, dashaLords[i % 9]);
    assert.equal(periods[0].start, '2000-01-01T00:00:00.000Z');
    if (i) assert.equal(calculateVimshottari(i * 360 / 27 - 1e-8, '2000-01-01T00:00:00Z')[0].lord,dashaLords[(i-1)%9]);
  });
}
test('hand-derived Julian-year dasha reference: Ashwini start and midpoint', () => {
  const start = calculateVimshottari(0,'2000-01-01T00:00:00Z');
  assert.equal(start[0].lord,'Ketu');
  assert.equal(start[0].end,'2006-12-31T18:00:00.000Z');
  // Ketu/Ketu = 7*7/120 years = 149.14375 days.
  assert.equal(start[0].antardashas[0].end,'2000-05-29T03:27:00.000Z');
  const half = calculateVimshottari(360/54,'2000-01-01T00:00:00Z');
  assert.equal(half[0].end,'2003-07-02T09:00:00.000Z');
  assert.ok(Date.parse(half[0].start)<Date.parse('2000-01-01'));
  const birthSub = half[0].antardashas.find(s=>Date.parse(s.start)<=Date.parse('2000-01-01') && Date.parse(s.end)>Date.parse('2000-01-01'));
  assert.equal(birthSub.lord,'Rahu');
});
test('all dasha periods tile one 120-year cycle without gaps or overlaps', () => {
  const periods = calculateVimshottari(311.5,'2000-01-01T00:00:00Z');
  assert.equal(periods.length,9);
  assert.equal(Date.parse(periods[8].end)-Date.parse(periods[0].start),43830*86400000);
  periods.forEach((p,i)=>{
    if(i) assert.equal(periods[i-1].end,p.start);
    assert.equal(p.antardashas[0].start,p.start);
    assert.equal(p.antardashas[8].end,p.end);
    assert.equal(p.antardashas[0].lord,p.lord);
    p.antardashas.forEach((sub,j)=>{
      if(j) assert.equal(p.antardashas[j-1].end,sub.start);
      assert.ok(Date.parse(sub.end)>Date.parse(sub.start));
    });
  });
  assert.throws(()=>calculateVimshottari(NaN,'2000-01-01'));
  assert.throws(()=>calculateVimshottari(0,'invalid'));
});
