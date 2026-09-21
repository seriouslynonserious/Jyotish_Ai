const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

// Compile the pure TypeScript utilities with the project's existing compiler.
const output = mkdtempSync(path.join(tmpdir(), 'jyotish-tests-'));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [
  require.resolve('typescript/bin/tsc'),
  'src/app/core/astrology/astrology.dev.ts',
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
