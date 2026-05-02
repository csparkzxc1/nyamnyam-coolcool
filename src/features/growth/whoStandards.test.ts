import {
  classifyWeight,
  interpolateWeightBand,
  WHO_WEIGHT_BOYS,
  WHO_WEIGHT_GIRLS,
  whoWeightTableFor,
} from './whoStandards';

describe('whoWeightTableFor', () => {
  it('returns the boys table for "M"', () => {
    expect(whoWeightTableFor('M')).toBe(WHO_WEIGHT_BOYS);
  });

  it('returns the girls table for "F"', () => {
    expect(whoWeightTableFor('F')).toBe(WHO_WEIGHT_GIRLS);
  });

  it('falls back to boys when sex is null/undefined', () => {
    expect(whoWeightTableFor(null)).toBe(WHO_WEIGHT_BOYS);
    expect(whoWeightTableFor(undefined)).toBe(WHO_WEIGHT_BOYS);
  });
});

describe('WHO data integrity', () => {
  it('every row has p3 < p50 < p97', () => {
    for (const t of [WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS]) {
      for (const row of t) {
        expect(row.p3).toBeLessThan(row.p50);
        expect(row.p50).toBeLessThan(row.p97);
      }
    }
  });

  it('weight grows monotonically with age at every percentile', () => {
    for (const t of [WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS]) {
      for (let i = 1; i < t.length; i += 1) {
        expect(t[i].p3).toBeGreaterThan(t[i - 1].p3);
        expect(t[i].p50).toBeGreaterThan(t[i - 1].p50);
        expect(t[i].p97).toBeGreaterThan(t[i - 1].p97);
      }
    }
  });

  it('age points are sorted ascending and start at 0 month', () => {
    for (const t of [WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS]) {
      expect(t[0].ageMonths).toBe(0);
      for (let i = 1; i < t.length; i += 1) {
        expect(t[i].ageMonths).toBeGreaterThan(t[i - 1].ageMonths);
      }
    }
  });
});

describe('interpolateWeightBand', () => {
  it('returns the table value exactly when age matches a sample', () => {
    const band = interpolateWeightBand(WHO_WEIGHT_BOYS, 6);
    const row = WHO_WEIGHT_BOYS.find((p) => p.ageMonths === 6);
    expect(band).toEqual({ p3: row?.p3, p50: row?.p50, p97: row?.p97 });
  });

  it('clamps to the first row for ages before the table starts', () => {
    expect(interpolateWeightBand(WHO_WEIGHT_BOYS, -2).p50).toBe(WHO_WEIGHT_BOYS[0].p50);
  });

  it('clamps to the last row for ages past the table', () => {
    const last = WHO_WEIGHT_BOYS[WHO_WEIGHT_BOYS.length - 1];
    expect(interpolateWeightBand(WHO_WEIGHT_BOYS, 36).p50).toBe(last.p50);
  });

  it('linearly interpolates between two adjacent rows', () => {
    // Between 4m (p50 = 7.0) and 6m (p50 = 7.9), midpoint at 5m.
    const band = interpolateWeightBand(WHO_WEIGHT_BOYS, 5);
    expect(band.p50).toBeCloseTo((7.0 + 7.9) / 2, 4);
  });

  it('handles an empty table by returning zeros', () => {
    expect(interpolateWeightBand([], 5)).toEqual({ p3: 0, p50: 0, p97: 0 });
  });
});

describe('classifyWeight', () => {
  const band = { p3: 5.0, p50: 7.0, p97: 9.0 };

  it('returns below-p3 when weight is under the floor', () => {
    expect(classifyWeight(4.5, band)).toBe('below-p3');
  });

  it('returns p3-p50 when weight is between floor and median', () => {
    expect(classifyWeight(6.0, band)).toBe('p3-p50');
  });

  it('returns p50-p97 when weight is between median and ceiling', () => {
    expect(classifyWeight(8.0, band)).toBe('p50-p97');
  });

  it('returns above-p97 when weight is at or above the ceiling', () => {
    expect(classifyWeight(9.5, band)).toBe('above-p97');
    expect(classifyWeight(9.0, band)).toBe('above-p97');
  });

  it('uses inclusive lower bound on each band', () => {
    expect(classifyWeight(5.0, band)).toBe('p3-p50');
    expect(classifyWeight(7.0, band)).toBe('p50-p97');
  });
});
