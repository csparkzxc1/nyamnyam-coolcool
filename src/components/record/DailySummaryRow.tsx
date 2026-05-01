import { Text, View } from 'react-native';

import { formatSleepMinutes, type DailySummary } from '@/features/logging/summarizeEvents';

export interface DailySummaryRowProps {
  summary: DailySummary;
  /** Style hint for the parent context — affects text color only. */
  variant?: 'light' | 'dark';
}

/**
 * One-line "오늘의 합계" row, intended to sit just under a section header
 * like "TODAY · 24h" on the home screen or "오늘 (4/30 목)" on the
 * record tab.
 *
 * Compact format: 🍼 240ml (3회) · 😴 4시간 30분 · 💧 5회 · 🛁 1회
 *
 * Fields with a count of zero are skipped so that early-morning, sparse
 * days don't render misleading "0회" strings.
 */
export function DailySummaryRow({ summary, variant = 'light' }: DailySummaryRowProps) {
  const parts: string[] = [];

  if (summary.feedCount > 0) {
    if (summary.feedAmountMl > 0) {
      parts.push(`🍼 ${summary.feedAmountMl}ml (${summary.feedCount}회)`);
    } else {
      parts.push(`🍼 ${summary.feedCount}회`);
    }
  }

  if (summary.sleepMinutes > 0) {
    parts.push(`😴 ${formatSleepMinutes(summary.sleepMinutes)}`);
  }

  if (summary.diaperCount > 0) {
    parts.push(`💧 ${summary.diaperCount}회`);
  }

  if (summary.bathCount > 0) {
    parts.push(`🛁 ${summary.bathCount}회`);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <View>
      <Text
        className={
          variant === 'dark'
            ? 'font-body text-[12px] text-white/80'
            : 'font-body text-[12px] text-fg-secondary'
        }
      >
        {parts.join(' · ')}
      </Text>
    </View>
  );
}
