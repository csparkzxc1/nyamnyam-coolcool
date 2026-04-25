import { Text, View } from 'react-native';

type TodaySummaryCardProps = {
  feedingCount: number;
  sleepCount: number;
  lastRecordLabel: string | null;
};

export function TodaySummaryCard({
  feedingCount,
  sleepCount,
  lastRecordLabel,
}: TodaySummaryCardProps) {
  return (
    <View className="mx-6 bg-bg-surface dark:bg-bg-surface-dark rounded-md px-5 py-5 shadow-soft">
      <SummaryRow emoji="🍼" label="수유" count={feedingCount} />
      <View className="h-3" />
      <SummaryRow emoji="😴" label="수면" count={sleepCount} />
      <View className="h-px bg-border-subtle dark:bg-border-subtle-dark mt-5 mb-3" />
      <Text className="font-body text-sm text-ink-tertiary dark:text-ink-tertiary-dark">
        마지막 기록: {lastRecordLabel ?? '아직 없어요'}
      </Text>
    </View>
  );
}

function SummaryRow({ emoji, label, count }: { emoji: string; label: string; count: number }) {
  return (
    <View className="flex-row items-baseline">
      <Text className="text-2xl mr-3">{emoji}</Text>
      <Text className="font-body text-base text-ink-secondary dark:text-ink-secondary-dark flex-1">
        {label}
      </Text>
      <Text className="font-display text-2xl text-ink-primary dark:text-ink-primary-dark">
        {count}
      </Text>
      <Text className="font-body text-sm text-ink-tertiary dark:text-ink-tertiary-dark ml-1">
        회
      </Text>
    </View>
  );
}
