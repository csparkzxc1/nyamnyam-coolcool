/**
 * Month-banded reference values for the Guide tab. The numbers here back the
 * "월령별 표준 데이터" tables and the "우리 아이 vs 평균" comparison card.
 *
 * Source of truth (PRD §4):
 *   - 보건복지부 임신육아종합포털 (아이사랑)
 *   - AAP (American Academy of Pediatrics)
 *   - AASM 2016 합의성명서
 *   - 대한소아청소년과학회 가이드
 *
 * The numeric `*Range` fields are used by personalSummary.ts for the
 * comparison card; the `*Label` fields are what render in the table.
 *
 * Bands are half-open: [fromDays, toDays). 30 days/month is the working
 * approximation across the codebase (matches standardIntervals.ts).
 */
import { differenceInDays } from 'date-fns';

const DAYS_PER_MONTH = 30;
const m = (n: number) => n * DAYS_PER_MONTH;

/** Closed numeric range used for "personal vs standard" comparison. */
export interface NumericRange {
  min: number;
  max: number;
}

interface BandBase {
  ageLabel: string;
  fromDays: number;
  toDays: number;
}

export interface SleepStandard extends BandBase {
  totalSleepLabel: string;
  /** 1일 총 수면 시간(시간) — comparison range. */
  totalSleepHoursRange: NumericRange;
  nightSleepLabel: string;
  napCountLabel: string;
  napDurationLabel: string;
  cycleLabel: string;
  longestStretchLabel: string;
}

export interface FeedStandard extends BandBase {
  perFeedLabel: string;
  intervalLabel: string;
  /** 수유 간격(분) — comparison range. */
  intervalMinutesRange: NumericRange;
  feedsPerDayLabel: string;
  totalDailyLabel: string;
  breastFeedsLabel: string;
  solidLabel: string;
}

/**
 * PRD §4.1. Bands are kept in sync with §4.2 where they overlap.
 *
 * The first band covers the newborn window (0~30 days). Bands beyond 12
 * months are included for completeness and as a safe fallback for any
 * baby that ages past the MVP target window.
 */
export const SLEEP_STANDARDS: readonly SleepStandard[] = [
  {
    ageLabel: '0~1개월',
    fromDays: 0,
    toDays: m(1),
    totalSleepLabel: '14~18시간',
    totalSleepHoursRange: { min: 14, max: 18 },
    nightSleepLabel: '8~9시간 (분산)',
    napCountLabel: '4~5회',
    napDurationLabel: '30분~4시간',
    cycleLabel: '50~60분',
    longestStretchLabel: '2~4시간',
  },
  {
    ageLabel: '1~3개월',
    fromDays: m(1),
    toDays: m(4),
    totalSleepLabel: '14~17시간',
    totalSleepHoursRange: { min: 14, max: 17 },
    nightSleepLabel: '8~10시간',
    napCountLabel: '3~4회',
    napDurationLabel: '1~2시간',
    cycleLabel: '약 40분',
    longestStretchLabel: '3~5시간',
  },
  {
    ageLabel: '4~6개월',
    fromDays: m(4),
    toDays: m(7),
    totalSleepLabel: '12~16시간',
    totalSleepHoursRange: { min: 12, max: 16 },
    nightSleepLabel: '9~11시간',
    napCountLabel: '3회',
    napDurationLabel: '1~2시간',
    cycleLabel: '약 45~50분',
    longestStretchLabel: '5~8시간',
  },
  {
    ageLabel: '7~9개월',
    fromDays: m(7),
    toDays: m(10),
    totalSleepLabel: '12~15시간',
    totalSleepHoursRange: { min: 12, max: 15 },
    nightSleepLabel: '10~11시간',
    napCountLabel: '2회',
    napDurationLabel: '1~2시간',
    cycleLabel: '약 50~60분',
    longestStretchLabel: '6~10시간',
  },
  {
    ageLabel: '10~12개월',
    fromDays: m(10),
    toDays: m(13),
    totalSleepLabel: '12~14시간',
    totalSleepHoursRange: { min: 12, max: 14 },
    nightSleepLabel: '10~12시간',
    napCountLabel: '2회',
    napDurationLabel: '1~1.5시간',
    cycleLabel: '약 60분',
    longestStretchLabel: '8~11시간',
  },
  {
    ageLabel: '13~18개월',
    fromDays: m(13),
    toDays: m(19),
    totalSleepLabel: '11~14시간',
    totalSleepHoursRange: { min: 11, max: 14 },
    nightSleepLabel: '10~12시간',
    napCountLabel: '1~2회',
    napDurationLabel: '1~2시간',
    cycleLabel: '성인과 유사',
    longestStretchLabel: '9~12시간',
  },
  {
    ageLabel: '19~24개월',
    fromDays: m(19),
    toDays: m(25),
    totalSleepLabel: '11~14시간',
    totalSleepHoursRange: { min: 11, max: 14 },
    nightSleepLabel: '10~12시간',
    napCountLabel: '1회',
    napDurationLabel: '1~2시간',
    cycleLabel: '성인과 유사',
    longestStretchLabel: '10~12시간',
  },
];

/**
 * PRD §4.2. The first three bands track the rapid early-week ramp.
 * intervalMinutesRange is computed from the hour-range label.
 */
export const FEED_STANDARDS: readonly FeedStandard[] = [
  {
    ageLabel: '0~7일',
    fromDays: 0,
    toDays: 7,
    perFeedLabel: '10~60ml',
    intervalLabel: '2~3시간',
    intervalMinutesRange: { min: 120, max: 180 },
    feedsPerDayLabel: '8~12회',
    totalDailyLabel: '점증',
    breastFeedsLabel: '8~12회/일',
    solidLabel: '❌',
  },
  {
    ageLabel: '1~4주',
    fromDays: 7,
    toDays: 28,
    perFeedLabel: '60~90ml',
    intervalLabel: '2~3시간',
    intervalMinutesRange: { min: 120, max: 180 },
    feedsPerDayLabel: '8~10회',
    totalDailyLabel: '480~720ml',
    breastFeedsLabel: '8~12회/일',
    solidLabel: '❌',
  },
  {
    ageLabel: '1~2개월',
    fromDays: 28,
    toDays: m(2),
    perFeedLabel: '90~120ml',
    intervalLabel: '3시간',
    intervalMinutesRange: { min: 165, max: 195 },
    feedsPerDayLabel: '6~8회',
    totalDailyLabel: '600~900ml',
    breastFeedsLabel: '7~9회/일',
    solidLabel: '❌',
  },
  {
    ageLabel: '2~3개월',
    fromDays: m(2),
    toDays: m(3),
    perFeedLabel: '120~150ml',
    intervalLabel: '3~4시간',
    intervalMinutesRange: { min: 180, max: 240 },
    feedsPerDayLabel: '6~7회',
    totalDailyLabel: '750~900ml',
    breastFeedsLabel: '6~8회/일',
    solidLabel: '❌',
  },
  {
    ageLabel: '3~4개월',
    fromDays: m(3),
    toDays: m(4),
    perFeedLabel: '150~180ml',
    intervalLabel: '4시간',
    intervalMinutesRange: { min: 225, max: 255 },
    feedsPerDayLabel: '5~6회',
    totalDailyLabel: '약 900ml',
    breastFeedsLabel: '5~6회/일',
    solidLabel: '❌',
  },
  {
    ageLabel: '4~6개월',
    fromDays: m(4),
    toDays: m(7),
    perFeedLabel: '150~210ml',
    intervalLabel: '4시간',
    intervalMinutesRange: { min: 225, max: 255 },
    feedsPerDayLabel: '4~5회',
    totalDailyLabel: '900~960ml',
    breastFeedsLabel: '4~5회/일',
    solidLabel: '시작 (1일 1회)',
  },
  {
    ageLabel: '7~9개월',
    fromDays: m(7),
    toDays: m(10),
    perFeedLabel: '180~210ml',
    intervalLabel: '4시간',
    intervalMinutesRange: { min: 225, max: 255 },
    feedsPerDayLabel: '3~4회',
    totalDailyLabel: '720~840ml',
    breastFeedsLabel: '4~5회/일',
    solidLabel: '1일 2회 (중기)',
  },
  {
    ageLabel: '10~12개월',
    fromDays: m(10),
    toDays: m(13),
    perFeedLabel: '180~240ml',
    intervalLabel: '4~5시간',
    intervalMinutesRange: { min: 240, max: 300 },
    feedsPerDayLabel: '3회',
    totalDailyLabel: '600~720ml',
    breastFeedsLabel: '3~4회/일',
    solidLabel: '1일 3회 + 간식',
  },
  {
    ageLabel: '12개월 이후',
    fromDays: m(13),
    toDays: m(25),
    perFeedLabel: '우유 전환',
    intervalLabel: '—',
    intervalMinutesRange: { min: 240, max: 360 },
    feedsPerDayLabel: '—',
    totalDailyLabel: '우유 ≤ 473ml',
    breastFeedsLabel: '자연 단유',
    solidLabel: '1일 3끼 + 간식',
  },
];

/**
 * Returns the band that contains the given age in days, or the last band
 * (oldest) when the baby is past the table's range. Negative ages clamp
 * to the first band — protective against future-dated birth dates that
 * occasionally slip past form validation.
 */
export function findBandForDays<T extends BandBase>(
  bands: readonly T[],
  ageInDays: number,
): T {
  if (ageInDays < 0) return bands[0];
  for (const band of bands) {
    if (ageInDays >= band.fromDays && ageInDays < band.toDays) return band;
  }
  return bands[bands.length - 1];
}

/** Convenience: resolve both standard tables for a given birth date. */
export function findStandardsForBirthDate(
  birthDate: Date,
  now: Date = new Date(),
): { sleep: SleepStandard; feed: FeedStandard; ageInDays: number } {
  const ageInDays = Math.max(0, differenceInDays(now, birthDate));
  return {
    sleep: findBandForDays(SLEEP_STANDARDS, ageInDays),
    feed: findBandForDays(FEED_STANDARDS, ageInDays),
    ageInDays,
  };
}
