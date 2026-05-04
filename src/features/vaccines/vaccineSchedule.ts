import { differenceInDays, differenceInMonths } from 'date-fns';

// ============================================================
// Types
// ============================================================

export interface VaccineDose {
  /** Stable ID for storage and React keys. */
  id: string;
  /** Vaccine code (e.g. 'BCG', 'HepB', 'DTaP'). Multiple doses share the code. */
  code: string;
  /** Korean display name. */
  name: string;
  /** Dose number within the vaccine series (1, 2, 3, …). 1 if single-dose. */
  doseNumber: number;
  /** Total doses in this vaccine series. Used for "1/3" labels. */
  totalDoses: number;
  /** Recommended age window in months from birth. The dose is "due" when
   *  the baby's age in months is between [minMonths, maxMonths]. */
  minMonths: number;
  maxMonths: number;
  /** Short description shown to parents. */
  description: string;
  /** Whether this dose is on the national mandatory schedule (필수). */
  mandatory: boolean;
}

export type VaccineStatus =
  | { kind: 'upcoming'; daysUntil: number }
  | { kind: 'due'; daysIntoWindow: number }
  | { kind: 'overdue'; daysOverdue: number }
  | { kind: 'completed'; completedAt: Date };

export interface VaccineDoseWithStatus {
  dose: VaccineDose;
  status: VaccineStatus;
  /** Ideal date this dose should be administered, derived from birthDate. */
  recommendedDate: Date;
  /** Last day of the recommended window. */
  windowEndDate: Date;
}

// ============================================================
// Korean national immunization schedule (NIP)
// ============================================================
//
// Source: 질병관리청 표준 예방접종일정표 (한국, 2024).
// Doses are listed in chronological order. minMonths/maxMonths give the
// recommended administration window — children should be vaccinated
// within this window unless a clinician advises otherwise.
//
// We only include doses up to ~24 months because that's the period where
// "track the next shot" is most useful for new parents. Boosters at 4-6
// years and 11-12 years are out of scope for the newborn-focused app.

export const VACCINE_SCHEDULE: readonly VaccineDose[] = [
  // 0개월
  {
    id: 'bcg-1',
    code: 'BCG',
    name: 'BCG (결핵)',
    doseNumber: 1,
    totalDoses: 1,
    minMonths: 0,
    maxMonths: 1,
    description: '생후 4주 이내 접종 권장',
    mandatory: true,
  },
  {
    id: 'hepb-1',
    code: 'HepB',
    name: 'B형간염 1차',
    doseNumber: 1,
    totalDoses: 3,
    minMonths: 0,
    maxMonths: 0,
    description: '출생 직후 (보통 분만 후 12시간 이내)',
    mandatory: true,
  },
  // 1개월
  {
    id: 'hepb-2',
    code: 'HepB',
    name: 'B형간염 2차',
    doseNumber: 2,
    totalDoses: 3,
    minMonths: 1,
    maxMonths: 2,
    description: '1개월 시기',
    mandatory: true,
  },
  // 2개월
  {
    id: 'dtap-1',
    code: 'DTaP',
    name: 'DTaP 1차 (디프테리아·파상풍·백일해)',
    doseNumber: 1,
    totalDoses: 5,
    minMonths: 2,
    maxMonths: 3,
    description: '2개월 시기',
    mandatory: true,
  },
  {
    id: 'ipv-1',
    code: 'IPV',
    name: '폴리오 1차',
    doseNumber: 1,
    totalDoses: 4,
    minMonths: 2,
    maxMonths: 3,
    description: '2개월 시기',
    mandatory: true,
  },
  {
    id: 'hib-1',
    code: 'Hib',
    name: 'Hib 1차 (b형 헤모필루스 인플루엔자)',
    doseNumber: 1,
    totalDoses: 4,
    minMonths: 2,
    maxMonths: 3,
    description: '2개월 시기',
    mandatory: true,
  },
  {
    id: 'pcv-1',
    code: 'PCV',
    name: '폐렴구균 1차',
    doseNumber: 1,
    totalDoses: 4,
    minMonths: 2,
    maxMonths: 3,
    description: '2개월 시기',
    mandatory: true,
  },
  {
    id: 'rv-1',
    code: 'RV',
    name: '로타바이러스 1차',
    doseNumber: 1,
    totalDoses: 2,
    minMonths: 2,
    maxMonths: 3,
    description: '2개월 시기',
    mandatory: true,
  },
  // 4개월
  {
    id: 'dtap-2',
    code: 'DTaP',
    name: 'DTaP 2차',
    doseNumber: 2,
    totalDoses: 5,
    minMonths: 4,
    maxMonths: 5,
    description: '4개월 시기',
    mandatory: true,
  },
  {
    id: 'ipv-2',
    code: 'IPV',
    name: '폴리오 2차',
    doseNumber: 2,
    totalDoses: 4,
    minMonths: 4,
    maxMonths: 5,
    description: '4개월 시기',
    mandatory: true,
  },
  {
    id: 'hib-2',
    code: 'Hib',
    name: 'Hib 2차',
    doseNumber: 2,
    totalDoses: 4,
    minMonths: 4,
    maxMonths: 5,
    description: '4개월 시기',
    mandatory: true,
  },
  {
    id: 'pcv-2',
    code: 'PCV',
    name: '폐렴구균 2차',
    doseNumber: 2,
    totalDoses: 4,
    minMonths: 4,
    maxMonths: 5,
    description: '4개월 시기',
    mandatory: true,
  },
  {
    id: 'rv-2',
    code: 'RV',
    name: '로타바이러스 2차',
    doseNumber: 2,
    totalDoses: 2,
    minMonths: 4,
    maxMonths: 5,
    description: '4개월 시기',
    mandatory: true,
  },
  // 6개월
  {
    id: 'dtap-3',
    code: 'DTaP',
    name: 'DTaP 3차',
    doseNumber: 3,
    totalDoses: 5,
    minMonths: 6,
    maxMonths: 7,
    description: '6개월 시기',
    mandatory: true,
  },
  {
    id: 'ipv-3',
    code: 'IPV',
    name: '폴리오 3차',
    doseNumber: 3,
    totalDoses: 4,
    minMonths: 6,
    maxMonths: 18,
    description: '6~18개월 시기',
    mandatory: true,
  },
  {
    id: 'hib-3',
    code: 'Hib',
    name: 'Hib 3차',
    doseNumber: 3,
    totalDoses: 4,
    minMonths: 6,
    maxMonths: 7,
    description: '6개월 시기',
    mandatory: true,
  },
  {
    id: 'pcv-3',
    code: 'PCV',
    name: '폐렴구균 3차',
    doseNumber: 3,
    totalDoses: 4,
    minMonths: 6,
    maxMonths: 7,
    description: '6개월 시기',
    mandatory: true,
  },
  {
    id: 'hepb-3',
    code: 'HepB',
    name: 'B형간염 3차',
    doseNumber: 3,
    totalDoses: 3,
    minMonths: 6,
    maxMonths: 7,
    description: '6개월 시기',
    mandatory: true,
  },
  {
    id: 'flu-1',
    code: 'Flu',
    name: '인플루엔자 1차',
    doseNumber: 1,
    totalDoses: 2,
    minMonths: 6,
    maxMonths: 12,
    description: '6개월 이후 매년 (첫해는 4주 간격 2회)',
    mandatory: true,
  },
  // 12개월
  {
    id: 'mmr-1',
    code: 'MMR',
    name: 'MMR 1차 (홍역·유행성이하선염·풍진)',
    doseNumber: 1,
    totalDoses: 2,
    minMonths: 12,
    maxMonths: 15,
    description: '12~15개월 시기',
    mandatory: true,
  },
  {
    id: 'var-1',
    code: 'VAR',
    name: '수두',
    doseNumber: 1,
    totalDoses: 1,
    minMonths: 12,
    maxMonths: 15,
    description: '12~15개월 시기',
    mandatory: true,
  },
  {
    id: 'hepa-1',
    code: 'HepA',
    name: 'A형간염 1차',
    doseNumber: 1,
    totalDoses: 2,
    minMonths: 12,
    maxMonths: 23,
    description: '12~23개월 시기',
    mandatory: true,
  },
  {
    id: 'jev-1',
    code: 'JEV',
    name: '일본뇌염 1차',
    doseNumber: 1,
    totalDoses: 5,
    minMonths: 12,
    maxMonths: 24,
    description: '12~24개월 시기',
    mandatory: true,
  },
  {
    id: 'pcv-4',
    code: 'PCV',
    name: '폐렴구균 4차',
    doseNumber: 4,
    totalDoses: 4,
    minMonths: 12,
    maxMonths: 15,
    description: '12~15개월 시기',
    mandatory: true,
  },
  {
    id: 'hib-4',
    code: 'Hib',
    name: 'Hib 4차',
    doseNumber: 4,
    totalDoses: 4,
    minMonths: 12,
    maxMonths: 15,
    description: '12~15개월 시기',
    mandatory: true,
  },
  // 15개월
  {
    id: 'dtap-4',
    code: 'DTaP',
    name: 'DTaP 4차',
    doseNumber: 4,
    totalDoses: 5,
    minMonths: 15,
    maxMonths: 18,
    description: '15~18개월 시기',
    mandatory: true,
  },
  // 18개월
  {
    id: 'hepa-2',
    code: 'HepA',
    name: 'A형간염 2차',
    doseNumber: 2,
    totalDoses: 2,
    minMonths: 18,
    maxMonths: 35,
    description: '1차 후 6개월 이상 간격',
    mandatory: true,
  },
] as const;

// ============================================================
// Status calculation
// ============================================================

/**
 * Add `months` months to `date`. Uses Date arithmetic so leap-year edge
 * cases (Feb 29 → Mar 1 in non-leap years) match what date-fns' `addMonths`
 * does, but stays dependency-light at this layer.
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  return result;
}

/**
 * Compute status for one dose given the baby's birth date and an optional
 * record of completed doses (id → completion date).
 *
 * Status rules:
 *  - completed: parent marked it done (we trust them)
 *  - upcoming: today is before recommendedDate (start of window)
 *  - due: today is in [recommendedDate, windowEndDate]
 *  - overdue: today is after windowEndDate
 *
 * The window is a rolling [minMonths, maxMonths+1) — so a dose with
 * maxMonths = 5 is still due on the last day of month 6 anniversary.
 */
export function computeDoseStatus(
  dose: VaccineDose,
  birthDate: Date,
  now: Date,
  completed: Readonly<Record<string, Date | undefined>> = {},
): VaccineDoseWithStatus {
  const completedAt = completed[dose.id];
  const recommendedDate = addMonths(birthDate, dose.minMonths);
  const windowEndDate = addMonths(birthDate, dose.maxMonths + 1);

  const status: VaccineStatus = (() => {
    if (completedAt) {
      return { kind: 'completed', completedAt };
    }
    if (now < recommendedDate) {
      return { kind: 'upcoming', daysUntil: differenceInDays(recommendedDate, now) };
    }
    if (now < windowEndDate) {
      return {
        kind: 'due',
        daysIntoWindow: differenceInDays(now, recommendedDate),
      };
    }
    return {
      kind: 'overdue',
      daysOverdue: differenceInDays(now, windowEndDate),
    };
  })();

  return { dose, status, recommendedDate, windowEndDate };
}

/**
 * Compute status for all doses, sorted into the order parents care
 * about: due/overdue first (most urgent), then upcoming, then completed.
 */
export function computeAllDoseStatuses(
  birthDate: Date,
  now: Date,
  completed: Readonly<Record<string, Date | undefined>> = {},
): VaccineDoseWithStatus[] {
  return VACCINE_SCHEDULE.map((dose) => computeDoseStatus(dose, birthDate, now, completed));
}

/**
 * Find the most-urgent next dose for the home/dashboard "다음 접종"
 * card. Returns null when every dose is completed.
 *
 * Priority: overdue (oldest overdue first) > due > upcoming (soonest
 * first). Completed doses are skipped.
 */
export function nextDose(
  birthDate: Date,
  now: Date,
  completed: Readonly<Record<string, Date | undefined>> = {},
): VaccineDoseWithStatus | null {
  const all = computeAllDoseStatuses(birthDate, now, completed);

  // Priority bucket: overdue first (most urgent), then due, then upcoming.
  const overdue = all.filter((d) => d.status.kind === 'overdue');
  if (overdue.length > 0) {
    return overdue.sort((a, b) =>
      (a.status as { daysOverdue: number }).daysOverdue >
      (b.status as { daysOverdue: number }).daysOverdue
        ? -1
        : 1,
    )[0] as VaccineDoseWithStatus;
  }

  const due = all.filter((d) => d.status.kind === 'due');
  if (due.length > 0) {
    return due.sort(
      (a, b) => a.recommendedDate.getTime() - b.recommendedDate.getTime(),
    )[0] as VaccineDoseWithStatus;
  }

  const upcoming = all.filter((d) => d.status.kind === 'upcoming');
  if (upcoming.length > 0) {
    return upcoming.sort(
      (a, b) => a.recommendedDate.getTime() - b.recommendedDate.getTime(),
    )[0] as VaccineDoseWithStatus;
  }

  return null; // everything completed
}

/**
 * Progress as a 0–1 fraction of completed mandatory doses. Useful for
 * a progress bar or "X of Y completed" line.
 */
export function vaccineProgress(completed: Readonly<Record<string, Date | undefined>> = {}): {
  completedCount: number;
  totalCount: number;
  fraction: number;
} {
  const total = VACCINE_SCHEDULE.filter((d) => d.mandatory).length;
  const done = VACCINE_SCHEDULE.filter((d) => d.mandatory && completed[d.id] !== undefined).length;
  return {
    completedCount: done,
    totalCount: total,
    fraction: total === 0 ? 0 : done / total,
  };
}

// Re-exported for tests.
export { differenceInMonths };
