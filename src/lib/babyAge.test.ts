import { formatBabyAge, getBabyInitial } from './babyAge';

describe('formatBabyAge', () => {
  it('shows "생후 N일 (D+NNN)" when baby is under 1 month old', () => {
    const birth = new Date('2026-04-15T00:00:00');
    const now = new Date('2026-05-01T00:00:00');
    expect(formatBabyAge(birth, now)).toBe('생후 16일 (D+016)');
  });

  it('shows "N개월 D일 (D+NNN)" when baby is over 1 month old', () => {
    const birth = new Date('2026-03-12T00:00:00');
    const now = new Date('2026-04-28T00:00:00');
    // 47 days total, 1 calendar month + 16 days
    expect(formatBabyAge(birth, now)).toBe('1개월 16일 (D+047)');
  });

  it('handles exact month boundaries', () => {
    const birth = new Date('2026-03-12T00:00:00');
    const now = new Date('2026-04-12T00:00:00');
    expect(formatBabyAge(birth, now)).toBe('1개월 0일 (D+031)');
  });

  it('handles same-day birth (newborn)', () => {
    const birth = new Date('2026-04-28T00:00:00');
    const now = new Date('2026-04-28T12:00:00');
    expect(formatBabyAge(birth, now)).toBe('생후 0일 (D+000)');
  });

  it('clamps future birth dates to "생후 0일 (D+000)"', () => {
    const birth = new Date('2026-12-01T00:00:00');
    const now = new Date('2026-04-28T00:00:00');
    expect(formatBabyAge(birth, now)).toBe('생후 0일 (D+000)');
  });

  it('pads single-digit days correctly', () => {
    const birth = new Date('2026-04-21T00:00:00');
    const now = new Date('2026-04-28T00:00:00');
    expect(formatBabyAge(birth, now)).toBe('생후 7일 (D+007)');
  });

  it('handles multi-month babies', () => {
    const birth = new Date('2025-10-15T00:00:00');
    const now = new Date('2026-04-28T00:00:00');
    const result = formatBabyAge(birth, now);
    expect(result).toMatch(/^6개월 \d+일 \(D\+\d{3}\)$/);
  });

  it('does not pad days beyond 3 digits', () => {
    const birth = new Date('2025-04-01T00:00:00');
    const now = new Date('2026-04-28T00:00:00');
    const result = formatBabyAge(birth, now);
    // Just check that 3+ digits are kept, not zero-stripped
    expect(result).toMatch(/D\+\d{3,}\)/);
  });
});

describe('getBabyInitial', () => {
  it('returns first Korean character', () => {
    expect(getBabyInitial('윤서아')).toBe('윤');
  });

  it('returns first Latin character', () => {
    expect(getBabyInitial('Alex')).toBe('A');
  });

  it('returns first character of single-syllable name', () => {
    expect(getBabyInitial('준')).toBe('준');
  });

  it('falls back to baby emoji when name is empty', () => {
    expect(getBabyInitial('')).toBe('👶');
  });

  it('falls back to baby emoji when name is whitespace', () => {
    expect(getBabyInitial('   ')).toBe('👶');
  });

  it('trims leading whitespace', () => {
    expect(getBabyInitial('  윤서아')).toBe('윤');
  });
});
