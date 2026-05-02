/**
 * Anomaly detection — surface safety-relevant patterns to caregivers as
 * in-app banners (T901) and, where critical, as push notifications (T603).
 *
 * Detection rules come from PRD §4 + reference engine in
 * docs/prediction_engine_reference.ts. The wording avoids any clinical
 * diagnosis (CLAUDE.md §11.9): every message is observational and
 * routes the caregiver to "소아과 상담" when stakes are high.
 */
import { differenceInDays, differenceInMinutes } from 'date-fns';

import type { DetailedEvent } from '@/features/logging/eventsTransform';

export type AnomalyCode =
  | 'FEEDING_TOO_FREQUENT'
  | 'FEEDING_TOO_SPARSE'
  | 'SLEEP_DEFICIT_3DAYS'
  | 'OVERFEEDING_RISK'
  | 'LOW_DIAPER_COUNT'
  | 'NAP_TOO_LONG';

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface Anomaly {
  code: AnomalyCode;
  severity: AnomalySeverity;
  /** One-line copy shown on the banner. */
  message: string;
  /** Longer detail shown when the banner is tapped open. */
  detail: string;
  /** Numeric context — used in unit tests + future analytics. */
  data: Record<string, number | string>;
}

/** Standard intervals copied from PRD §4.2 in hours. */
function standardFeedIntervalHoursForMonth(month: number): [number, number] {
  if (month <= 1) return [2, 3];
  if (month <= 3) return [3, 4];
  if (month <= 6) return [3, 4];
  if (month <= 9) return [4, 4];
  return [4, 5];
}

/** PRD §4.1 maximum nap minutes before NAP_TOO_LONG fires. */
const NAP_MAX_MINUTES = 150;

/** PRD §4.2 daily formula ceiling — fires OVERFEEDING_RISK above this. */
export const DAILY_FORMULA_CEILING_ML = 1000;

/** PRD §4.2 minimum wet diapers per 24h before LOW_DIAPER_COUNT fires. */
export const MIN_WET_DIAPERS_24H = 6;

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function monthAge(birthDate: Date, now: Date): number {
  const days = Math.max(0, differenceInDays(now, birthDate));
  return Math.floor(days / 30);
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/**
 * Pulls feed-start intervals (minutes) for the last `days` days.
 * Skips any interval that crosses the lookback boundary so the average
 * isn't dragged by a single old gap.
 */
function feedIntervalMinutesWithin(
  events: readonly DetailedEvent[],
  days: number,
  now: Date,
): number[] {
  const since = now.getTime() - days * DAY;
  const feeds = events
    .filter((e) => e.kind === 'feed' && e.startedAt.getTime() >= since)
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const intervals: number[] = [];
  for (let i = 1; i < feeds.length; i += 1) {
    intervals.push(differenceInMinutes(feeds[i].startedAt, feeds[i - 1].startedAt));
  }
  return intervals;
}

/**
 * Sums COMPLETED sleep duration that overlaps a [from, to) window.
 * Active sleeps (no endedAt) cap at `now` so an in-progress nap counts
 * up to the present moment, not forever.
 */
function sumSleepHoursInRange(
  events: readonly DetailedEvent[],
  from: Date,
  to: Date,
  now: Date,
): number {
  let totalMs = 0;
  for (const e of events) {
    if (e.kind !== 'sleep') continue;
    const startMs = Math.max(e.startedAt.getTime(), from.getTime());
    const endMs = Math.min((e.endedAt ?? now).getTime(), to.getTime());
    if (endMs > startMs) totalMs += endMs - startMs;
  }
  return totalMs / HOUR;
}

/** PRD §4.1 sleep total (hours) lower bound by month. */
function standardDailySleepLowerBound(month: number): number {
  if (month <= 0) return 14;
  if (month <= 3) return 14;
  if (month <= 6) return 12;
  if (month <= 9) return 12;
  if (month <= 12) return 12;
  return 11;
}

export interface DetectInput {
  babyBirthDate: Date;
  /** A 7+ day rolling window of detailed events. */
  events: readonly DetailedEvent[];
  now: Date;
}

/**
 * Walks the 6 detection rules and returns the firing anomalies, ordered
 * critical → warning → info. The home banner renders only the top entry,
 * but consumers (notifications, logs) get the full list.
 */
export function detectAnomalies(input: DetectInput): Anomaly[] {
  const { babyBirthDate, events, now } = input;
  const month = monthAge(babyBirthDate, now);
  const found: Anomaly[] = [];

  // ---- 1) 수유 간격 이상 (last 24h) ----
  const recentIntervals = feedIntervalMinutesWithin(events, 1, now);
  if (recentIntervals.length > 0) {
    const avg = mean(recentIntervals);
    const [lo, hi] = standardFeedIntervalHoursForMonth(month);
    const lowerBound = lo * 60 * 0.5;
    const upperBound = hi * 60 * 1.5;

    if (avg < lowerBound) {
      found.push({
        code: 'FEEDING_TOO_FREQUENT',
        severity: 'info',
        message: '수유 간격이 평소보다 짧아요',
        detail:
          '최근 24시간 평균 수유 간격이 표준의 절반 이하예요. 충분히 빨고 있는지 자세히 살펴봐 주세요. 며칠 이상 지속되면 소아과 상담을 권해요.',
        data: { avgIntervalMin: Math.round(avg) },
      });
    }

    if (month <= 3 && avg > upperBound) {
      found.push({
        code: 'FEEDING_TOO_SPARSE',
        severity: 'warning',
        message: '수유 간격이 너무 길어져요',
        detail:
          '최근 24시간 평균 수유 간격이 표준의 1.5배를 넘어요. 0~3개월 아기는 충분한 수유가 중요해요. 깨워서 수유를 시도해보고, 컨디션이 처지면 소아과 상담을 권해요.',
        data: { avgIntervalMin: Math.round(avg) },
      });
    }
  }

  // ---- 2) 3일 연속 수면 부족 ----
  const last3Days = [0, 1, 2].map((dayBack) => {
    const dayEnd = new Date(now.getTime() - dayBack * DAY);
    const dayStart = new Date(dayEnd.getTime() - DAY);
    return sumSleepHoursInRange(events, dayStart, dayEnd, now);
  });
  const lowerBound = standardDailySleepLowerBound(month) * 0.7;
  if (last3Days.every((h) => h > 0 && h < lowerBound)) {
    found.push({
      code: 'SLEEP_DEFICIT_3DAYS',
      severity: 'warning',
      message: '최근 3일 수면이 부족해요',
      detail:
        '최근 3일 모두 표준 수면 시간의 70% 미만이었어요. 낮잠 환경(어두움·소리·온도)을 점검하고, 졸림 신호를 놓치지 않게 주의해 주세요. 1주일 이상 지속되면 소아과 상담을 권해요.',
      data: { last3Days: last3Days.map((h) => h.toFixed(1)).join(', ') },
    });
  }

  // ---- 3) 1일 총 분유량 ----
  const todayStart = startOfLocalDay(now);
  const todayFormulaMl = events
    .filter(
      (e) =>
        e.kind === 'feed' &&
        e.type === 'formula' &&
        e.startedAt >= todayStart &&
        typeof e.amountMl === 'number',
    )
    .reduce((sum, e) => sum + (e.kind === 'feed' && e.amountMl ? e.amountMl : 0), 0);
  if (todayFormulaMl > DAILY_FORMULA_CEILING_ML) {
    found.push({
      code: 'OVERFEEDING_RISK',
      severity: 'warning',
      message: `오늘 분유량이 ${todayFormulaMl}ml예요`,
      detail: `1일 총 분유량 ${DAILY_FORMULA_CEILING_ML}ml 권장 상한을 넘었어요. 한 번에 먹는 양을 줄이거나 텀을 늘려보고, 자주 반복되면 소아과 상담을 권해요.`,
      data: { todayMl: todayFormulaMl },
    });
  }

  // ---- 4) 소변 기저귀 부족 (last 24h) ----
  const since24 = new Date(now.getTime() - DAY);
  const wetCount = events.filter(
    (e) =>
      e.kind === 'diaper' && (e.type === 'wet' || e.type === 'both') && e.startedAt >= since24,
  ).length;
  // Only meaningful when at least one diaper is logged in the window — a
  // brand-new baby with zero records shouldn't trip the alarm.
  const totalDiapers24h = events.filter((e) => e.kind === 'diaper' && e.startedAt >= since24)
    .length;
  if (month <= 6 && totalDiapers24h > 0 && wetCount < MIN_WET_DIAPERS_24H) {
    found.push({
      code: 'LOW_DIAPER_COUNT',
      severity: wetCount <= 4 ? 'critical' : 'warning',
      message: `24시간 소변 기저귀 ${wetCount}장`,
      detail: `24시간 동안 소변 기저귀가 ${wetCount}장으로 일반 기준(${MIN_WET_DIAPERS_24H}장 이상)보다 적어요. 탈수 위험 신호일 수 있으니, 24시간 이상 지속되면 소아과 진료를 권해요.`,
      data: { wetCount },
    });
  }

  // ---- 5) 진행 중 낮잠 시간 초과 ----
  const ongoingNap = events.find(
    (e) => e.kind === 'sleep' && e.type === 'nap' && !e.endedAt,
  );
  if (ongoingNap) {
    const napMin = differenceInMinutes(now, ongoingNap.startedAt);
    if (napMin > NAP_MAX_MINUTES) {
      found.push({
        code: 'NAP_TOO_LONG',
        severity: 'info',
        message: `낮잠이 ${napMin}분째예요`,
        detail: `낮잠이 ${NAP_MAX_MINUTES}분(2시간 30분)을 넘었어요. 길어진 낮잠은 밤잠 시작을 늦출 수 있어 깨우는 걸 권장해요.`,
        data: { napMin },
      });
    }
  }

  // Sort: critical → warning → info. Within a severity, keep insertion
  // order so the deterministic detection sequence above also drives UI.
  const rank: Record<AnomalySeverity, number> = { critical: 0, warning: 1, info: 2 };
  found.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return found;
}
