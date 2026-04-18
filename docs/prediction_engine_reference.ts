/**
 * 토닥(Todak) — 수유·수면 예측 알고리즘
 * ----------------------------------------
 * PRD §3의 의사코드를 실제 TypeScript로 구현한 참조 구현체입니다.
 * - 프레임워크 비의존 (순수 함수 위주)
 * - Flutter/React Native 포팅 용이
 * - 모든 시간은 JS Date 기반, 내부 계산은 밀리초 단위
 *
 * 의존성 없음. Node 18+ / Deno / 모던 브라우저에서 동작.
 *
 * 데이터 출처:
 *   - 보건복지부 임신육아종합포털 아이사랑
 *   - American Academy of Pediatrics (AAP)
 *   - American Academy of Sleep Medicine (AASM) 2016
 */

// =========================================================
// 1. 타입 정의
// =========================================================

export type FeedingType = 'breast_left' | 'breast_right' | 'formula' | 'solid';
export type SleepType = 'nap' | 'night';
export type DiaperType = 'wet' | 'dirty' | 'both';
export type AlertLevel = 'green' | 'yellow' | 'red';
export type Confidence = 'low' | 'medium' | 'high';

export interface Baby {
  id: string;
  name: string;
  birthDate: Date;
  weightKg?: number;
  feedingType: 'breast' | 'formula' | 'mixed';
}

export interface FeedingRecord {
  id: string;
  babyId: string;
  type: FeedingType;
  startAt: Date;
  endAt: Date;
  amountMl?: number;
}

export interface SleepRecord {
  id: string;
  babyId: string;
  type: SleepType;
  startAt: Date;
  endAt: Date | null; // null이면 현재 자는 중
}

export interface DiaperRecord {
  id: string;
  babyId: string;
  type: DiaperType;
  at: Date;
}

export interface FeedingPrediction {
  predictedAt: Date;
  intervalMinutes: number;
  confidence: Confidence;
  alertLevel: AlertLevel;
  message: string;
  reasoning: {
    alpha: number;
    standardIntervalMin: number;
    personalAverageMin: number | null;
    sampleSize: number;
  };
}

export interface SleepPrediction {
  predictedAt: Date;
  awakeWindowMinutes: number;
  shouldShowSleepCueSoon: boolean;
}

export type AnomalyCode =
  | 'FEEDING_TOO_FREQUENT'
  | 'FEEDING_TOO_SPARSE'
  | 'SLEEP_DEFICIT_3DAYS'
  | 'OVERFEEDING_RISK'
  | 'LOW_DIAPER_COUNT'
  | 'NAP_TOO_LONG';

export interface Anomaly {
  code: AnomalyCode;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data?: Record<string, number | string>;
}

// =========================================================
// 2. 월령별 표준 테이블 (PRD §4에서 발췌)
// =========================================================

interface StandardRow {
  /** 수유 간격 (시간) */
  feedingIntervalH: [number, number];
  /** 깨어있을 수 있는 시간 윈도우 (분) */
  awakeWindowMin: [number, number];
  /** 1일 총 수면 시간 (시간) */
  sleepTotalH: [number, number];
  /** 1회 분유량 (ml) */
  feedingAmountMl: [number, number];
  /** 1일 총 분유량 상한 (ml) */
  dailyTotalMaxMl: number;
  /** 이 월령에서 "수유 안 한 지 X시간" 경고 임계 (시간) — null이면 룰 적용 안 함 */
  maxGapHoursWarning: number | null;
  /** 낮잠 1회 최대 권장 시간 (분) */
  napMaxMin: number;
}

export const STANDARD_TABLE: Record<number, StandardRow> = {
  // 0~1개월 (신생아)
  0: {
    feedingIntervalH: [2, 3],
    awakeWindowMin: [45, 60],
    sleepTotalH: [14, 18],
    feedingAmountMl: [60, 120],
    dailyTotalMaxMl: 720,
    maxGapHoursWarning: 4, // ← 보건복지부 권고: 신생아 4시간 이상 금식 시 탈수 위험
    napMaxMin: 150,
  },
  // 1~3개월
  2: {
    feedingIntervalH: [3, 4],
    awakeWindowMin: [60, 90],
    sleepTotalH: [14, 17],
    feedingAmountMl: [120, 150],
    dailyTotalMaxMl: 900,
    maxGapHoursWarning: 5,
    napMaxMin: 150,
  },
  // 4~6개월
  5: {
    feedingIntervalH: [3.5, 4.5],
    awakeWindowMin: [120, 150],
    sleepTotalH: [12, 16],
    feedingAmountMl: [150, 210],
    dailyTotalMaxMl: 960, // AAP 상한
    maxGapHoursWarning: 6,
    napMaxMin: 150,
  },
  // 7~9개월
  8: {
    feedingIntervalH: [4, 4.5],
    awakeWindowMin: [150, 180],
    sleepTotalH: [12, 15],
    feedingAmountMl: [180, 210],
    dailyTotalMaxMl: 840,
    maxGapHoursWarning: 8,
    napMaxMin: 120,
  },
  // 10~12개월
  11: {
    feedingIntervalH: [4, 5],
    awakeWindowMin: [180, 240],
    sleepTotalH: [12, 14],
    feedingAmountMl: [180, 240],
    dailyTotalMaxMl: 720,
    maxGapHoursWarning: 10,
    napMaxMin: 90,
  },
};

/**
 * 생년월일로 월령(정수 months)을 계산한 뒤, STANDARD_TABLE의 적절한 키로 매핑
 */
export function resolveStandard(birthDate: Date, now: Date = new Date()): StandardRow {
  const m = computeMonthAge(birthDate, now);
  if (m <= 1) return STANDARD_TABLE[0];
  if (m <= 3) return STANDARD_TABLE[2];
  if (m <= 6) return STANDARD_TABLE[5];
  if (m <= 9) return STANDARD_TABLE[8];
  return STANDARD_TABLE[11];
}

// =========================================================
// 3. 유틸 함수
// =========================================================

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export function computeMonthAge(birthDate: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - birthDate.getTime();
  // 평균 그레고리안 월: 30.4375일
  return Math.floor(diffMs / (30.4375 * 24 * HOUR));
}

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * 이상치를 trim한 평균 (상·하위 10% 제거)
 * — 신생아 데이터는 이상치가 많아(예: 새벽 3시간 깨어있음) 이 함수 사용 권장
 */
export function trimmedMean(nums: number[], trimRatio = 0.1): number {
  if (nums.length === 0) return 0;
  if (nums.length < 5) return mean(nums); // 샘플 부족시 전체 평균
  const sorted = [...nums].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * trimRatio);
  const kept = sorted.slice(trim, sorted.length - trim);
  return mean(kept);
}

// =========================================================
// 4. 가중치 함수 α
// =========================================================

/**
 * 월령이 낮을수록 개인 데이터가 부족하고 변동성 크므로 표준 가중치 ↑
 * 월령이 높아질수록 개인 패턴이 더 안정화되므로 개인 가중치 ↑
 */
export function alphaForMonth(month: number): number {
  if (month <= 1) return 0.7;
  if (month <= 4) return 0.5;
  return 0.3;
}

// =========================================================
// 5. 다음 수유 시각 예측 (메인 함수)
// =========================================================

export function predictNextFeeding(
  baby: Baby,
  recentFeedings: FeedingRecord[],
  now: Date = new Date()
): FeedingPrediction {
  const month = computeMonthAge(baby.birthDate, now);
  const std = resolveStandard(baby.birthDate, now);

  // 가장 최근 수유 찾기 — endAt 기준 내림차순
  const sorted = [...recentFeedings].sort(
    (a, b) => b.endAt.getTime() - a.endAt.getTime()
  );
  const last = sorted[0];

  if (!last) {
    // 데이터 없음 — 안전한 기본값
    return {
      predictedAt: new Date(now.getTime() + 2 * HOUR),
      intervalMinutes: 120,
      confidence: 'low',
      alertLevel: 'green',
      message: '첫 수유를 기록해 주세요. 그래야 예측을 시작할 수 있어요.',
      reasoning: {
        alpha: alphaForMonth(month),
        standardIntervalMin: mean(std.feedingIntervalH) * 60,
        personalAverageMin: null,
        sampleSize: 0,
      },
    };
  }

  // 표준 간격 (분)
  const stdIntervalMin = mean(std.feedingIntervalH) * 60;

  // 최근 7일간 수유 간격 수집 (endAt -> 다음 startAt)
  const intervals = collectFeedingIntervals(recentFeedings, 7);
  const personalAvgMin =
    intervals.length >= 3 ? trimmedMean(intervals) : null;

  // 가중평균
  const alpha = alphaForMonth(month);
  const predictedIntervalMin =
    personalAvgMin === null
      ? stdIntervalMin
      : alpha * stdIntervalMin + (1 - alpha) * personalAvgMin;

  const predictedAt = new Date(last.endAt.getTime() + predictedIntervalMin * MINUTE);
  const gapMinNow = (now.getTime() - last.endAt.getTime()) / MINUTE;

  // 경고 레벨 결정
  let alertLevel: AlertLevel = 'green';
  let message = '다음 수유까지 여유가 있어요';

  // 0~1개월 강화 룰 — 4시간 초과 시 RED
  if (std.maxGapHoursWarning !== null && gapMinNow > std.maxGapHoursWarning * 60) {
    alertLevel = 'red';
    message = `⚠️ 마지막 수유 후 ${std.maxGapHoursWarning}시간이 지났어요. 깨워서 수유해 주세요.`;
  } else if (gapMinNow > predictedIntervalMin * 1.25) {
    alertLevel = 'yellow';
    message = '수유 예상 시각을 지나고 있어요. 배고픔 신호를 살펴보세요.';
  } else if (gapMinNow > predictedIntervalMin * 0.9) {
    alertLevel = 'green';
    message = '곧 수유 시간이 다가오고 있어요';
  }

  return {
    predictedAt,
    intervalMinutes: Math.round(predictedIntervalMin),
    confidence: computeConfidence(intervals.length),
    alertLevel,
    message,
    reasoning: {
      alpha,
      standardIntervalMin: stdIntervalMin,
      personalAverageMin: personalAvgMin,
      sampleSize: intervals.length,
    },
  };
}

function collectFeedingIntervals(records: FeedingRecord[], lastNDays: number): number[] {
  const cutoff = Date.now() - lastNDays * 24 * HOUR;
  const recent = records
    .filter(r => r.startAt.getTime() >= cutoff)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    // 이전 수유 종료 → 이번 수유 시작 까지의 간격 (분)
    const gap = (recent[i].startAt.getTime() - recent[i - 1].endAt.getTime()) / MINUTE;
    if (gap > 10 && gap < 12 * 60) {
      // 10분 미만(중복기록)·12시간 초과(기록누락) 제외
      intervals.push(gap);
    }
  }
  return intervals;
}

// =========================================================
// 6. 다음 수면 시각 예측
// =========================================================

export function predictNextSleep(
  baby: Baby,
  recentSleeps: SleepRecord[],
  now: Date = new Date()
): SleepPrediction {
  const month = computeMonthAge(baby.birthDate, now);
  const std = resolveStandard(baby.birthDate, now);

  // 가장 최근에 깨어난 시각 (종료된 수면 기록 중 가장 최근)
  const lastCompleted = recentSleeps
    .filter(s => s.endAt !== null)
    .sort((a, b) => (b.endAt!.getTime() - a.endAt!.getTime()))[0];

  const lastWake = lastCompleted ? lastCompleted.endAt! : now;

  // 표준 awake window
  let window = mean(std.awakeWindowMin);

  // 개인 평균(최근 7일) 계산
  const personalWindows = collectAwakeWindows(recentSleeps, 7);
  if (personalWindows.length >= 3) {
    const alpha = alphaForMonth(month);
    const personalAvg = trimmedMean(personalWindows);
    window = alpha * window + (1 - alpha) * personalAvg;
  }

  const predictedAt = new Date(lastWake.getTime() + window * MINUTE);

  // 졸림 신호 경고 (예상 15분 전)
  const cueWarnTime = predictedAt.getTime() - 15 * MINUTE;
  const shouldShowSleepCueSoon = now.getTime() >= cueWarnTime && now < predictedAt;

  return {
    predictedAt,
    awakeWindowMinutes: Math.round(window),
    shouldShowSleepCueSoon,
  };
}

function collectAwakeWindows(records: SleepRecord[], lastNDays: number): number[] {
  const cutoff = Date.now() - lastNDays * 24 * HOUR;
  const completed = records
    .filter(s => s.endAt !== null && s.endAt.getTime() >= cutoff)
    .sort((a, b) => a.endAt!.getTime() - b.endAt!.getTime());

  const windows: number[] = [];
  for (let i = 1; i < completed.length; i++) {
    // 이전 수면 종료(=깨어남) → 다음 수면 시작 까지 = awake window
    const gap = (completed[i].startAt.getTime() - completed[i - 1].endAt!.getTime()) / MINUTE;
    if (gap > 15 && gap < 10 * 60) {
      windows.push(gap);
    }
  }
  return windows;
}

// =========================================================
// 7. 이상 감지 (Anomaly Detection)
// =========================================================

export function detectAnomalies(
  baby: Baby,
  feedings: FeedingRecord[],
  sleeps: SleepRecord[],
  diapers: DiaperRecord[],
  now: Date = new Date()
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const month = computeMonthAge(baby.birthDate, now);
  const std = resolveStandard(baby.birthDate, now);

  // ---- 1) 수유 간격 이상 ----
  const intervals = collectFeedingIntervals(feedings, 1); // 최근 1일
  if (intervals.length > 0) {
    const avgIntervalMin = mean(intervals);
    const stdIntervalMin = mean(std.feedingIntervalH) * 60;

    if (avgIntervalMin < stdIntervalMin * 0.5) {
      anomalies.push({
        code: 'FEEDING_TOO_FREQUENT',
        severity: 'info',
        message: '수유 간격이 평균보다 짧아요. 충분히 빨고 있는지 확인해 보세요.',
        data: { avgIntervalMin: Math.round(avgIntervalMin) },
      });
    }

    if (month <= 3 && avgIntervalMin > stdIntervalMin * 1.5) {
      anomalies.push({
        code: 'FEEDING_TOO_SPARSE',
        severity: 'warning',
        message: '수유 간격이 평균보다 길어요. 깨워서 수유가 필요할 수 있어요.',
        data: { avgIntervalMin: Math.round(avgIntervalMin) },
      });
    }
  }

  // ---- 2) 3일 연속 수면 부족 ----
  const last3DaysSleep = [0, 1, 2].map(dayBack => {
    const dayStart = new Date(now.getTime() - (dayBack + 1) * 24 * HOUR);
    const dayEnd = new Date(now.getTime() - dayBack * 24 * HOUR);
    return sumSleepHoursInRange(sleeps, dayStart, dayEnd);
  });
  const minTarget = std.sleepTotalH[0] * 0.7;
  if (last3DaysSleep.every(h => h < minTarget)) {
    anomalies.push({
      code: 'SLEEP_DEFICIT_3DAYS',
      severity: 'warning',
      message: '최근 3일간 수면이 평균보다 부족해요. 낮잠 환경을 점검해 보세요.',
      data: { last3Days: last3DaysSleep.map(h => h.toFixed(1)).join(', ') },
    });
  }

  // ---- 3) 1일 총 분유량 상한 ----
  const todayStart = startOfDay(now);
  const todayFormulaMl = feedings
    .filter(
      f => f.type === 'formula' && f.startAt >= todayStart && typeof f.amountMl === 'number'
    )
    .reduce((sum, f) => sum + (f.amountMl ?? 0), 0);

  if (todayFormulaMl > 1000) {
    anomalies.push({
      code: 'OVERFEEDING_RISK',
      severity: 'warning',
      message: '오늘 총 분유량이 1,000ml를 넘었어요. 소아비만·간부담 우려로 소아과 상담을 권장합니다.',
      data: { todayMl: todayFormulaMl },
    });
  }

  // ---- 4) 소변 기저귀 부족 (탈수 조기지표) ----
  const last24h = new Date(now.getTime() - 24 * HOUR);
  const wetCount = diapers.filter(
    d => (d.type === 'wet' || d.type === 'both') && d.at >= last24h
  ).length;
  if (month <= 6 && wetCount < 6) {
    anomalies.push({
      code: 'LOW_DIAPER_COUNT',
      severity: wetCount <= 4 ? 'critical' : 'warning',
      message: `24시간 내 소변 기저귀가 ${wetCount}장입니다. 6장 미만이면 탈수 신호일 수 있어요. 소아과 상담을 권장해요.`,
      data: { wetCount },
    });
  }

  // ---- 5) 낮잠이 너무 긺 ----
  const ongoingNap = sleeps.find(s => s.type === 'nap' && s.endAt === null);
  if (ongoingNap) {
    const napMin = (now.getTime() - ongoingNap.startAt.getTime()) / MINUTE;
    if (napMin > std.napMaxMin) {
      anomalies.push({
        code: 'NAP_TOO_LONG',
        severity: 'info',
        message: `낮잠이 ${Math.round(napMin)}분째예요. 밤잠에 영향을 줄 수 있어 깨우는 것을 권장해요.`,
        data: { napMin: Math.round(napMin) },
      });
    }
  }

  return anomalies;
}

function sumSleepHoursInRange(records: SleepRecord[], from: Date, to: Date): number {
  let totalMs = 0;
  for (const s of records) {
    const start = Math.max(s.startAt.getTime(), from.getTime());
    const end = Math.min((s.endAt ?? new Date()).getTime(), to.getTime());
    if (end > start) totalMs += end - start;
  }
  return totalMs / HOUR;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

// =========================================================
// 8. 신뢰도 계산
// =========================================================

export function computeConfidence(sampleSize: number): Confidence {
  if (sampleSize < 3) return 'low';
  if (sampleSize < 10) return 'medium';
  return 'high';
}

// =========================================================
// 9. 데모 & 스모크 테스트 (개발 시 node로 직접 실행 가능)
// =========================================================

if (typeof require !== 'undefined' && require.main === module) {
  const baby: Baby = {
    id: 'b1',
    name: '유찬',
    birthDate: new Date(Date.now() - 47 * 24 * HOUR),
    weightKg: 4.8,
    feedingType: 'formula',
  };
  const now = new Date();

  const feedings: FeedingRecord[] = [
    { id: 'f1', babyId: 'b1', type: 'formula',
      startAt: new Date(now.getTime() - 150 * MINUTE),
      endAt:   new Date(now.getTime() - 145 * MINUTE), amountMl: 120 },
    { id: 'f2', babyId: 'b1', type: 'formula',
      startAt: new Date(now.getTime() - 320 * MINUTE),
      endAt:   new Date(now.getTime() - 315 * MINUTE), amountMl: 110 },
    { id: 'f3', babyId: 'b1', type: 'formula',
      startAt: new Date(now.getTime() - 490 * MINUTE),
      endAt:   new Date(now.getTime() - 485 * MINUTE), amountMl: 100 },
    { id: 'f4', babyId: 'b1', type: 'formula',
      startAt: new Date(now.getTime() - 650 * MINUTE),
      endAt:   new Date(now.getTime() - 645 * MINUTE), amountMl: 120 },
  ];
  const sleeps: SleepRecord[] = [
    { id: 's1', babyId: 'b1', type: 'nap',
      startAt: new Date(now.getTime() - 125 * MINUTE),
      endAt:   new Date(now.getTime() - 75 * MINUTE) },
  ];
  const diapers: DiaperRecord[] = [
    { id: 'd1', babyId: 'b1', type: 'wet', at: new Date(now.getTime() - 45 * MINUTE) },
    { id: 'd2', babyId: 'b1', type: 'wet', at: new Date(now.getTime() - 4 * HOUR) },
    { id: 'd3', babyId: 'b1', type: 'both', at: new Date(now.getTime() - 8 * HOUR) },
  ];

  console.log('=== 다음 수유 예측 ===');
  console.log(predictNextFeeding(baby, feedings, now));
  console.log('\n=== 다음 수면 예측 ===');
  console.log(predictNextSleep(baby, sleeps, now));
  console.log('\n=== 이상 감지 ===');
  console.log(detectAnomalies(baby, feedings, sleeps, diapers, now));
}
