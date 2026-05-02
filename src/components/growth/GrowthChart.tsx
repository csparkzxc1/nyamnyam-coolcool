import { useMemo } from 'react';

import { Text, View } from 'react-native';

import { differenceInDays } from 'date-fns';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';

import {
  classifyWeight,
  interpolateWeightBand,
  type Sex,
  whoWeightTableFor,
  type PercentilePoint,
} from '@/features/growth/whoStandards';

export interface GrowthMeasurement {
  /** ISO timestamp of measurement. */
  measuredAt: Date;
  /** kg, may be null when only height was recorded for that visit. */
  weightKg: number | null;
}

export interface GrowthChartProps {
  babyBirthDate: Date;
  babySex: Sex | null;
  measurements: readonly GrowthMeasurement[];
  /** Maximum age (months) the chart x-axis covers. Default 24m. */
  maxMonths?: number;
}

const CHART_HEIGHT = 220;
const CHART_PAD_TOP = 20;
const CHART_PAD_BOTTOM = 32;
const CHART_PAD_LEFT = 32;
const CHART_PAD_RIGHT = 16;

const COLOR_P3 = '#C66E7E'; // accent-rose
const COLOR_P50 = '#6E8565'; // accent-sage
const COLOR_P97 = '#D68E2F'; // accent-amber
const COLOR_DOT = '#B85428'; // accent-sienna
const COLOR_GRID = 'rgba(42, 29, 18, 0.08)';
const COLOR_AXIS_LABEL = '#8A7A63';

/**
 * Returns the latest weight zone classification for the most-recent
 * measurement, or null if no weight was ever recorded. Used to color
 * the textual summary above the chart.
 */
function summarizeLatest(
  table: readonly PercentilePoint[],
  measurements: readonly GrowthMeasurement[],
  babyBirthDate: Date,
): { ageMonths: number; weightKg: number; zone: ReturnType<typeof classifyWeight> } | null {
  const sorted = [...measurements].sort(
    (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime(),
  );
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].weightKg !== null) {
      const w = sorted[i].weightKg as number;
      const age = differenceInDays(sorted[i].measuredAt, babyBirthDate) / 30;
      const band = interpolateWeightBand(table, age);
      return { ageMonths: age, weightKg: w, zone: classifyWeight(w, band) };
    }
  }
  return null;
}

const ZONE_COPY: Record<ReturnType<typeof classifyWeight>, { label: string; tone: string }> = {
  'below-p3': { label: '평균보다 가벼워요', tone: COLOR_P3 },
  'p3-p50': { label: '평균 범위 — 가벼운 편', tone: COLOR_P50 },
  'p50-p97': { label: '평균 범위 — 무거운 편', tone: COLOR_P50 },
  'above-p97': { label: '평균보다 무거워요', tone: COLOR_P97 },
};

/**
 * Pure-SVG growth chart. Three percentile reference lines (P3 / P50 /
 * P97) form the background bands; the baby's weight measurements are
 * overlaid as a connected polyline with one dot per visit.
 *
 * Width is responsive — the parent View sets the SVG width via
 * `viewBox` so the chart re-flows on rotation.
 *
 * For the MVP we plot weight only; height/head circumference can be
 * added by stacking additional charts under this one in a future
 * iteration without touching this component.
 */
export function GrowthChart({
  babyBirthDate,
  babySex,
  measurements,
  maxMonths = 24,
}: GrowthChartProps) {
  const table = whoWeightTableFor(babySex);

  // ----- y-axis bounds: pick a range that covers the WHO band + any
  // outlier measurement. min always 0, max bumped up by 10% headroom.
  const yMax = useMemo(() => {
    const tableMax = Math.max(...table.map((p) => p.p97));
    const measMax = measurements.reduce<number>(
      (m, x) => (x.weightKg !== null ? Math.max(m, x.weightKg) : m),
      0,
    );
    return Math.ceil(Math.max(tableMax, measMax) * 1.1);
  }, [table, measurements]);

  // ----- viewBox sizing -----
  const VIEW_W = 320;
  const VIEW_H = CHART_HEIGHT;
  const plotW = VIEW_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const plotH = VIEW_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  const xScale = (months: number) => CHART_PAD_LEFT + (months / maxMonths) * plotW;
  const yScale = (kg: number) => CHART_PAD_TOP + (1 - kg / yMax) * plotH;

  // Generate band paths. We sample at every WHO data point (no need
  // for sub-month interpolation — visual fidelity is plenty).
  const bandPath = (key: 'p3' | 'p50' | 'p97'): string => {
    return table
      .filter((p) => p.ageMonths <= maxMonths)
      .map((p, i) => {
        const x = xScale(p.ageMonths);
        const y = yScale(p[key]);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const measurementPoints = measurements
    .filter((m) => m.weightKg !== null)
    .map((m) => {
      const ageMonths = differenceInDays(m.measuredAt, babyBirthDate) / 30;
      return { x: xScale(Math.min(maxMonths, Math.max(0, ageMonths))), y: yScale(m.weightKg as number) };
    });
  const polylinePoints = measurementPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Y-axis grid + labels every 2kg.
  const yGridSteps: number[] = [];
  for (let kg = 0; kg <= yMax; kg += 2) yGridSteps.push(kg);

  // X-axis labels every 3 months.
  const xLabels: number[] = [];
  for (let m = 0; m <= maxMonths; m += 3) xLabels.push(m);

  const summary = summarizeLatest(table, measurements, babyBirthDate);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <View>
        <Text
          className="font-body text-[11px] uppercase tracking-[2px]"
          style={{ color: COLOR_AXIS_LABEL }}
        >
          성장 곡선 · 몸무게
        </Text>
        <Text
          className="mt-[4px] font-display text-[16px] font-medium"
          style={{ color: '#2A1D12' }}
        >
          WHO 표준 비교
        </Text>
      </View>

      {summary ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <Text className="font-display text-[22px] font-medium" style={{ color: '#2A1D12' }}>
            {summary.weightKg.toFixed(2)} kg
          </Text>
          <Text className="font-body text-[12px]" style={{ color: ZONE_COPY[summary.zone].tone }}>
            · {ZONE_COPY[summary.zone].label}
          </Text>
        </View>
      ) : (
        <Text className="font-body text-[12px]" style={{ color: COLOR_AXIS_LABEL }}>
          아직 기록된 몸무게가 없어요
        </Text>
      )}

      <Svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
      >
        {/* Y grid lines */}
        {yGridSteps.map((kg) => (
          <Line
            key={`yg-${kg}`}
            x1={CHART_PAD_LEFT}
            x2={VIEW_W - CHART_PAD_RIGHT}
            y1={yScale(kg)}
            y2={yScale(kg)}
            stroke={COLOR_GRID}
            strokeWidth={1}
          />
        ))}

        {/* Y labels */}
        {yGridSteps.map((kg) => (
          <SvgText
            key={`yl-${kg}`}
            x={CHART_PAD_LEFT - 4}
            y={yScale(kg) + 3}
            fontSize="9"
            textAnchor="end"
            fill={COLOR_AXIS_LABEL}
          >
            {kg}
          </SvgText>
        ))}

        {/* X labels */}
        {xLabels.map((mth) => (
          <SvgText
            key={`xl-${mth}`}
            x={xScale(mth)}
            y={VIEW_H - CHART_PAD_BOTTOM + 14}
            fontSize="9"
            textAnchor="middle"
            fill={COLOR_AXIS_LABEL}
          >
            {mth}
          </SvgText>
        ))}

        {/* Percentile bands */}
        <Path d={bandPath('p3')} fill="none" stroke={COLOR_P3} strokeWidth={1.4} strokeDasharray="3,3" />
        <Path d={bandPath('p50')} fill="none" stroke={COLOR_P50} strokeWidth={1.6} />
        <Path d={bandPath('p97')} fill="none" stroke={COLOR_P97} strokeWidth={1.4} strokeDasharray="3,3" />

        {/* Measurement polyline + dots */}
        {measurementPoints.length >= 2 ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={COLOR_DOT}
            strokeWidth={2}
          />
        ) : null}
        {measurementPoints.map((p, i) => (
          <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r={3.5} fill={COLOR_DOT} />
        ))}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <LegendDot color={COLOR_P3} label="P3" dashed />
        <LegendDot color={COLOR_P50} label="P50 (중앙값)" />
        <LegendDot color={COLOR_P97} label="P97" dashed />
        <LegendDot color={COLOR_DOT} label="우리 아기" />
      </View>

      <Text className="font-body text-[10px]" style={{ color: COLOR_AXIS_LABEL }}>
        가로축: 개월 · 세로축: kg · 출처: WHO Child Growth Standards 2006
      </Text>
    </View>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: 12,
          height: 2,
          backgroundColor: color,
          opacity: dashed ? 0.7 : 1,
        }}
      />
      <Text className="font-body text-[10px]" style={{ color: COLOR_AXIS_LABEL }}>
        {label}
      </Text>
    </View>
  );
}
