import { Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function GuideScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-display text-2xl text-ink-primary">가이드</Text>
        <Text className="mt-2 text-sm text-ink-secondary">준비 중</Text>
      </View>
    </SafeAreaView>
  );
}
