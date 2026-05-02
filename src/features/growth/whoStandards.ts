/**
 * WHO Child Growth Standards (2006) — weight-for-age, boys & girls,
 * 0–24 months. Three percentile lines (P3 / P50 / P97) covering the
 * "underweight / typical / overweight" bands the chart highlights.
 *
 * Values are sampled at the canonical well-baby visit ages (0, 1, 2, 3,
 * 4, 6, 9, 12, 15, 18, 21, 24 months) and were transcribed from WHO's
 * official tables. We deliberately store only 3 lines (not the full
 * 5/15/85 set) so the chart stays readable on a phone screen — adding
 * 15/85 is a future enhancement when the user asks for it.
 *
 * Source: WHO Child Growth Standards, weight-for-age z-scores
 * https://www.who.int/tools/child-growth-standards
 */

export type Sex = 'M' | 'F';

export interface PercentilePoint {
  /** Age in completed months. */
  ageMonths: number;
  /** Weight in kg at the 3rd percentile (P3). */
  p3: number;
  /** Median (50th percentile). */
  p50: number;
  /** Weight in kg at the 97th percentile (P97). */
  p97: number;
}

export const WHO_WEIGHT_BOYS: readonly PercentilePoint[] = [
  { ageMonths: 0, p3: 2.5, p50: 3.3, p97: 4.4 },
  { ageMonths: 1, p3: 3.4, p50: 4.5, p97: 5.8 },
  { ageMonths: 2, p3: 4.4, p50: 5.6, p97: 7.1 },
  { ageMonths: 3, p3: 5.1, p50: 6.4, p97: 8.0 },
  { ageMonths: 4, p3: 5.6, p50: 7.0, p97: 8.7 },
  { ageMonths: 6, p3: 6.4, p50: 7.9, p97: 9.8 },
  { ageMonths: 9, p3: 7.1, p50: 8.9, p97: 10.9 },
  { ageMonths: 12, p3: 7.7, p50: 9.6, p97: 11.8 },
  { ageMonths: 15, p3: 8.3, p50: 10.3, p97: 12.7 },
  { ageMonths: 18, p3: 8.8, p50: 10.9, p97: 13.5 },
  { ageMonths: 21, p3: 9.2, p50: 11.5, p97: 14.3 },
  { ageMonths: 24, p3: 9.7, p50: 12.2, p97: 15.1 },
];

export const WHO_WEIGHT_GIRLS: readonly PercentilePoint[] = [
  { ageMonths: 0, p3: 2.4, p50: 3.2, p97: 4.2 },
  { ageMonths: 1, p3: 3.2, p50: 4.2, p97: 5.5 },
  { ageMonths: 2, p3: 3.9, p50: 5.1, p97: 6.6 },
  { ageMonths: 3, p3: 4.5, p50: 5.8, p97: 7.5 },
  { ageMonths: 4, p3: 5.0, p50: 6.4, p97: 8.2 },
  { ageMonths: 6, p3: 5.7, p50: 7.3, p97: 9.3 },
  { ageMonths: 9, p3: 6.5, p50: 8.2, p97: 10.5 },
  { ageMonths: 12, p3: 7.0, p50: 8.9, p97: 11.5 },
  { ageMonths: 15, p3: 7.6, p50: 9.6, p97: 12.4 },
  { ageMonths: 18, p3: 8.1, p50: 10.2, p97: 13.2 },
  { ageMonths: 21, p3: 8.6, p50: 10.9, p97: 14.0 },
  { ageMonths: 24, p3: 9.0, p50: 11.5, p97: 14.8 },
];

/**
 * Selects the right percentile table for a given sex. Falls back to
 * boys when sex is unknown — boys' median is slightly higher, so the
 * relative position the chart shows will lean conservative on
 * "looks underweight" rather than "looks overweight".
 */
export function whoWeightTableFor(sex: Sex | null | undefined): readonly PercentilePoint[] {
  return sex === 'F' ? WHO_WEIGHT_GIRLS : WHO_WEIGHT_BOYS;
}

/**
 * Linearly interpolates the percentile bounds at an arbitrary age
 * (in months, can be fractional). Beyond the table range, clamps to
 * the nearest endpoint — protective against future-dated rows.
 */
export function interpolateWeightBand(
  table: readonly PercentilePoint[],
  ageMonths: number,
): { p3: number; p50: number; p97: number } {
  if (table.length === 0) return { p3: 0, p50: 0, p97: 0 };
  if (ageMonths <= table[0].ageMonths) {
    const { p3, p50, p97 } = table[0];
    return { p3, p50, p97 };
  }
  const last = table[table.length - 1];
  if (ageMonths >= last.ageMonths) {
    return { p3: last.p3, p50: last.p50, p97: last.p97 };
  }
  for (let i = 0; i < table.length - 1; i += 1) {
    const a = table[i];
    const b = table[i + 1];
    if (ageMonths >= a.ageMonths && ageMonths < b.ageMonths) {
      const t = (ageMonths - a.ageMonths) / (b.ageMonths - a.ageMonths);
      return {
        p3: a.p3 + (b.p3 - a.p3) * t,
        p50: a.p50 + (b.p50 - a.p50) * t,
        p97: a.p97 + (b.p97 - a.p97) * t,
      };
    }
  }
  return { p3: last.p3, p50: last.p50, p97: last.p97 };
}

export type WeightZone = 'below-p3' | 'p3-p50' | 'p50-p97' | 'above-p97';

/** Buckets an observed weight into one of the four standard zones. */
export function classifyWeight(
  weightKg: number,
  band: { p3: number; p50: number; p97: number },
): WeightZone {
  if (weightKg < band.p3) return 'below-p3';
  if (weightKg < band.p50) return 'p3-p50';
  if (weightKg < band.p97) return 'p50-p97';
  return 'above-p97';
}
