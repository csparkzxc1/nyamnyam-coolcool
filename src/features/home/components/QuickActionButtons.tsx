import { Alert, Text, TouchableOpacity, View } from 'react-native';

export function QuickActionButtons() {
  return (
    <View className="px-6 mt-8">
      <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-3">
        첫 기록을 남겨볼까요?
      </Text>
      <ActionButton
        emoji="🍼"
        label="수유 기록"
        primary
        onPress={() =>
          Alert.alert('곧 만들 거예요', '수유 기록 화면은 다음 업데이트에서 추가돼요.')
        }
      />
      <View className="h-3" />
      <ActionButton
        emoji="😴"
        label="수면 기록"
        onPress={() =>
          Alert.alert('곧 만들 거예요', '수면 기록 화면은 다음 업데이트에서 추가돼요.')
        }
      />
    </View>
  );
}

function ActionButton({
  emoji,
  label,
  primary,
  onPress,
}: {
  emoji: string;
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`flex-row items-center justify-center rounded-md py-4 ${
        primary
          ? 'bg-ink-primary dark:bg-ink-primary-dark'
          : 'bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark'
      }`}
    >
      <Text className="text-xl mr-2">{emoji}</Text>
      <Text
        className={`font-body text-base font-semibold ${
          primary
            ? 'text-ink-on-accent dark:text-bg-page-dark'
            : 'text-ink-primary dark:text-ink-primary-dark'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
