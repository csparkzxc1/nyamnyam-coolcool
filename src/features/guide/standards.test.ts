import {
  FEED_STANDARDS,
  findBandForDays,
  findStandardsForBirthDate,
  SLEEP_STANDARDS,
} from './standards';

describe('SLEEP_STANDARDS', () => {
  it('covers the newborn through 2-year window without gaps', () => {
    let cursor = 0;
    for (const band of SLEEP_STANDARDS) {
      expect(band.fromDays).toBe(cursor);
      expect(band.toDays).toBeGreaterThan(band.fromDays);
      cursor = band.toDays;
    }
    // Last band reaches at least 24 months (≈ 720 days).
    expect(cursor).toBeGreaterThanOrEqual(24 * 30);
  });

  it('exposes a numeric range that brackets the labelled hours', () => {
    for (const band of SLEEP_STANDARDS) {
      const { min, max } = band.totalSleepHoursRange;
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThanOrEqual(min);
      expect(band.totalSleepLabel).toContain(`${min}~${max}시간`);
    }
  });
});

describe('FEED_STANDARDS', () => {
  it('covers the newborn through 2-year window without gaps', () => {
    let cursor = 0;
    for (const band of FEED_STANDARDS) {
      expect(band.fromDays).toBe(cursor);
      expect(band.toDays).toBeGreaterThan(band.fromDays);
      cursor = band.toDays;
    }
    expect(cursor).toBeGreaterThanOrEqual(24 * 30);
  });

  it('keeps the interval range monotonic non-decreasing across bands', () => {
    // Older babies should never feed more frequently than younger ones.
    let prevMin = 0;
    for (const band of FEED_STANDARDS) {
      expect(band.intervalMinutesRange.min).toBeGreaterThanOrEqual(prevMin - 1);
      prevMin = band.intervalMinutesRange.min;
    }
  });
});

describe('findBandForDays', () => {
  it('returns the matching band for a value inside its window', () => {
    expect(findBandForDays(SLEEP_STANDARDS, 0).ageLabel).toBe('0~1개월');
    expect(findBandForDays(SLEEP_STANDARDS, 45).ageLabel).toBe('1~3개월');
    expect(findBandForDays(SLEEP_STANDARDS, 150).ageLabel).toBe('4~6개월');
  });

  it('clamps negative ages to the first band', () => {
    expect(findBandForDays(SLEEP_STANDARDS, -10).ageLabel).toBe('0~1개월');
  });

  it('falls back to the last band for ages past the table', () => {
    const last = SLEEP_STANDARDS[SLEEP_STANDARDS.length - 1];
    expect(findBandForDays(SLEEP_STANDARDS, 9999).ageLabel).toBe(last.ageLabel);
  });

  it('treats toDays as exclusive', () => {
    // 30 days = exactly the boundary between 0~1m and 1~3m.
    expect(findBandForDays(SLEEP_STANDARDS, 29).ageLabel).toBe('0~1개월');
    expect(findBandForDays(SLEEP_STANDARDS, 30).ageLabel).toBe('1~3개월');
  });
});

describe('findStandardsForBirthDate', () => {
  it('resolves both tables for a 45-day-old', () => {
    const now = new Date('2026-05-02T12:00:00');
    const birth = new Date('2026-03-18T12:00:00'); // 45 days
    const result = findStandardsForBirthDate(birth, now);
    expect(result.ageInDays).toBe(45);
    expect(result.sleep.ageLabel).toBe('1~3개월');
    expect(result.feed.ageLabel).toBe('1~2개월');
  });

  it('clamps a future birth date to today (0 days)', () => {
    const now = new Date('2026-05-02T12:00:00');
    const birth = new Date('2027-01-01T12:00:00');
    const result = findStandardsForBirthDate(birth, now);
    expect(result.ageInDays).toBe(0);
    expect(result.sleep.ageLabel).toBe('0~1개월');
    expect(result.feed.ageLabel).toBe('0~7일');
  });
});
