import { Text, View } from 'react-native';

import { APP_NAME } from '@/constants/config';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-bg-page dark:bg-bg-page-dark">
      <Text className="font-display text-3xl text-ink-primary dark:text-ink-primary-dark">
        Hello
      </Text>
      <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mt-2">
        {APP_NAME}
      </Text>
    </View>
  );
}
