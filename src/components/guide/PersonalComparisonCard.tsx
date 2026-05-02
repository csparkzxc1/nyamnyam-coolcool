import { Text, View } from 'react-native';

import type { ComparisonBucket } from '@/features/guide/personalSummary';
import type { NumericRange } from '@/features/guide/standards';

export interface ComparisonRow {
  label: string;
  /** Personal value to display, or null when no data exists yet. */
  personal: number | null;
  /** Personal-value formatter (e.g. "180분", "13.5시간"). */
  formatPersonal: (n: number) => string;
  /** Standard range to display ("표준 X~Y"). */
  standardRange: NumericRange;
  /** Standard-range formatter (renders both bounds + unit). */
  formatRange: (r: NumericRange) => string;
  /** Comparison bucket; ignored when personal is null. */
  bucket: ComparisonBucket | null;
  /** Sample count; if too small the row degrades to "데이터 부족" copy. */
  sampleCount: number;
  /** Minimum samples for the comparison to be meaningful. */
  minSamples: number;
}

export interface PersonalComparisonCardProps {
  rows: readonly ComparisonRow[];
}

const BUCKET_TONE: Record<ComparisonBucket, { bg: string; ink: string; label: string }> = {
  within: { bg: 'rgba(110, 133, 101, 0.16)', ink: '#4F6649', label: '표준 범위' },
  low: { bg: 'rgba(184, 84, 40, 0.12)', ink: '#B85428', label: '표준보다 짧음' },
  high: { bg: 'rgba(214, 142, 47, 0.16)', ink: '#9E6818', label: '표준보다 긴 편' },
};

/**
 * "우리 아이 vs 평균" card. Renders a row per metric with the personal
 * average, the population-standard range, and a coloured badge categorising
 * the comparison. Falls back gracefully when sample size is too small —
 * the prediction engine already encodes the same idea via "패턴 학습 중",
 * so the copy here matches that mental model.
 */
export function PersonalComparisonCard({ rows }: PersonalComparisonCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 14,
      }}
    >
      <View>
        <Text
          className="font-body text-[11px] uppercase tracking-[2px]"
          style={{ color: '#8A7A63' }}
        >
          최근 7일
        </Text>
        <Text
          className="mt-[4px] font-display text-[16px] font-medium"
          style={{ color: '#2A1D12' }}
        >
          우리 아이 vs 평균
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {rows.map((row) => {
          const learning = row.personal === null || row.sampleCount < row.minSamples;
          const tone = !learning && row.bucket ? BUCKET_TONE[row.bucket] : null;
          return (
            <View
              key={row.label}
              style={{
                gap: 6,
                paddingTop: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text className="font-body text-[13px]" style={{ color: '#5C4A37' }}>
                  {row.label}
                </Text>
                {tone ? (
                  <View
                    className="rounded-full px-[8px] py-[3px]"
                    style={{ backgroundColor: tone.bg }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: tone.ink }}
                    >
                      {tone.label}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-[10px]" style={{ color: '#8A7A63' }}>
                    패턴 학습 중
                  </Text>
                )}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <Text
                  className="font-display text-[22px] font-medium"
                  style={{ color: learning ? '#8A7A63' : '#2A1D12' }}
                >
                  {row.personal !== null ? row.formatPersonal(row.personal) : '—'}
                </Text>
                <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
                  · 표준 {row.formatRange(row.standardRange)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
