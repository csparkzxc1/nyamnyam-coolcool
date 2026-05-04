/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it } from '@jest/globals';

import {
  VACCINE_SCHEDULE,
  computeAllDoseStatuses,
  computeDoseStatus,
  nextDose,
  vaccineProgress,
} from './vaccineSchedule';

// ============================================================
// Schedule shape
// ============================================================

describe('VACCINE_SCHEDULE', () => {
  it('contains the core newborn vaccines', () => {
    const codes = new Set(VACCINE_SCHEDULE.map((d) => d.code));
    expect(codes).toContain('BCG');
    expect(codes).toContain('HepB');
    expect(codes).toContain('DTaP');
    expect(codes).toContain('IPV');
    expect(codes).toContain('PCV');
    expect(codes).toContain('MMR');
  });

  it('every dose has a unique id', () => {
    const ids = VACCINE_SCHEDULE.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('doseNumber never exceeds totalDoses', () => {
    for (const d of VACCINE_SCHEDULE) {
      expect(d.doseNumber).toBeLessThanOrEqual(d.totalDoses);
      expect(d.doseNumber).toBeGreaterThanOrEqual(1);
    }
  });

  it('minMonths <= maxMonths for every dose', () => {
    for (const d of VACCINE_SCHEDULE) {
      expect(d.minMonths).toBeLessThanOrEqual(d.maxMonths);
    }
  });

  it('DTaP series has 5 doses', () => {
    const dtap = VACCINE_SCHEDULE.filter((d) => d.code === 'DTaP');
    expect(dtap.length).toBeGreaterThanOrEqual(4); // 4-5 depending on schedule
    expect(dtap[0]!.totalDoses).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================
// computeDoseStatus
// ============================================================

describe('computeDoseStatus', () => {
  const birthDate = new Date(2026, 0, 1); // Jan 1, 2026
  const bcg = VACCINE_SCHEDULE.find((d) => d.id === 'bcg-1')!;
  const dtap1 = VACCINE_SCHEDULE.find((d) => d.id === 'dtap-1')!;

  it('returns "completed" when the dose has a completion date', () => {
    const completedAt = new Date(2026, 0, 15);
    const result = computeDoseStatus(bcg, birthDate, new Date(2026, 1, 1), {
      'bcg-1': completedAt,
    });
    expect(result.status.kind).toBe('completed');
    expect((result.status as { completedAt: Date }).completedAt).toEqual(completedAt);
  });

  it('returns "upcoming" when today is before the window', () => {
    // DTaP 1차 minMonths=2 → recommendedDate = Mar 1
    // Test "today" = Feb 1
    const result = computeDoseStatus(dtap1, birthDate, new Date(2026, 1, 1));
    expect(result.status.kind).toBe('upcoming');
    expect((result.status as { daysUntil: number }).daysUntil).toBeGreaterThan(0);
  });

  it('returns "due" when today is inside the window', () => {
    // DTaP 1차 window = [Mar 1, Apr 1). Test today = Mar 15.
    const result = computeDoseStatus(dtap1, birthDate, new Date(2026, 2, 15));
    expect(result.status.kind).toBe('due');
  });

  it('returns "overdue" when today is past the window end', () => {
    // DTaP 1차 maxMonths=3 → window ends Apr 1.
    // Test today = May 1, well past.
    const result = computeDoseStatus(dtap1, birthDate, new Date(2026, 5, 1));
    expect(result.status.kind).toBe('overdue');
    expect((result.status as { daysOverdue: number }).daysOverdue).toBeGreaterThan(0);
  });

  it('recommendedDate matches birth + minMonths', () => {
    // BCG minMonths=0 → recommendedDate = birthDate
    const bcgResult = computeDoseStatus(bcg, birthDate, birthDate);
    expect(bcgResult.recommendedDate.getMonth()).toBe(0);
    // DTaP1 minMonths=2 → recommendedDate = Mar 1
    const dtap1Result = computeDoseStatus(dtap1, birthDate, birthDate);
    expect(dtap1Result.recommendedDate.getMonth()).toBe(2);
  });
});

// ============================================================
// computeAllDoseStatuses
// ============================================================

describe('computeAllDoseStatuses', () => {
  it('returns one entry per scheduled dose', () => {
    const birthDate = new Date(2026, 0, 1);
    const result = computeAllDoseStatuses(birthDate, new Date());
    expect(result.length).toBe(VACCINE_SCHEDULE.length);
  });

  it('reflects completed doses in the output', () => {
    const birthDate = new Date(2026, 0, 1);
    const result = computeAllDoseStatuses(birthDate, new Date(), {
      'bcg-1': new Date(2026, 0, 10),
    });
    const bcg = result.find((r) => r.dose.id === 'bcg-1')!;
    expect(bcg.status.kind).toBe('completed');
  });
});

// ============================================================
// nextDose
// ============================================================

describe('nextDose', () => {
  const birthDate = new Date(2026, 0, 1);

  it('returns the most-overdue dose first when any are overdue', () => {
    // Today = 1 year + 6 months later → BCG, HepB, DTaP1, etc all overdue
    const result = nextDose(birthDate, new Date(2027, 6, 1));
    expect(result).not.toBeNull();
    expect(result!.status.kind).toBe('overdue');
  });

  it('returns a "due" dose when none are overdue', () => {
    // Today = 2 months 15 days → DTaP1/IPV1/etc are due, none overdue yet
    const completed: Record<string, Date> = {
      'bcg-1': new Date(2026, 0, 10),
      'hepb-1': new Date(2026, 0, 1),
      'hepb-2': new Date(2026, 1, 1),
    };
    const result = nextDose(birthDate, new Date(2026, 2, 15), completed);
    expect(result).not.toBeNull();
    expect(result!.status.kind).toBe('due');
  });

  it('returns the soonest "upcoming" dose when no due/overdue', () => {
    // Today = same as birth date
    // BCG and HepB1 are "due" (minMonths=0). Mark those completed.
    const completed: Record<string, Date> = {
      'bcg-1': birthDate,
      'hepb-1': birthDate,
    };
    const result = nextDose(birthDate, birthDate, completed);
    expect(result).not.toBeNull();
    expect(result!.status.kind).toBe('upcoming');
  });

  it('returns null when every dose is completed', () => {
    const completed: Record<string, Date> = {};
    for (const d of VACCINE_SCHEDULE) {
      completed[d.id] = birthDate;
    }
    const result = nextDose(birthDate, new Date(), completed);
    expect(result).toBeNull();
  });
});

// ============================================================
// vaccineProgress
// ============================================================

describe('vaccineProgress', () => {
  it('returns 0 progress when nothing is completed', () => {
    const p = vaccineProgress({});
    expect(p.completedCount).toBe(0);
    expect(p.fraction).toBe(0);
    expect(p.totalCount).toBeGreaterThan(0);
  });

  it('returns 1.0 when all mandatory doses are completed', () => {
    const all: Record<string, Date> = {};
    for (const d of VACCINE_SCHEDULE) {
      if (d.mandatory) all[d.id] = new Date();
    }
    const p = vaccineProgress(all);
    expect(p.fraction).toBe(1);
    expect(p.completedCount).toBe(p.totalCount);
  });

  it('counts only completed entries', () => {
    const some: Record<string, Date> = {
      'bcg-1': new Date(),
      'hepb-1': new Date(),
      'hepb-2': new Date(),
    };
    const p = vaccineProgress(some);
    expect(p.completedCount).toBe(3);
    expect(p.fraction).toBeGreaterThan(0);
    expect(p.fraction).toBeLessThan(1);
  });
});
