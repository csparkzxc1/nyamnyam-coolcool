import { Text, View } from 'react-native';

import { getDdayLabel, getGreeting } from '@/features/home/utils/greeting';

type GreetingHeaderProps = {
  babyName: string;
  birthDateIso: string;
};

/**
 * 홈 화면 상단 인사 영역.
 *
 *  좋은 아침이에요          ← 인사 (작게)
 *  사랑이 D+12              ← baby 이름 + 일수 (크게, 디스플레이 폰트)
 *
 * 시각 정보는 props로 받지 않음 — 컴포넌트가 마운트될 때 시간 계산.
 * 다음 phase에서 useMemo + 분 단위 갱신 고려.
 */
export function GreetingHeader({ babyName, birthDateIso }: GreetingHeaderProps) {
  const greeting = getGreeting();
  const dday = getDdayLabel(birthDateIso);

  return (
    <View className="px-6 pt-4 pb-6">
      <Text className="font-display text-2xl text-ink-secondary dark:text-ink-secondary-dark">
        {greeting}
      </Text>
      <Text className="font-display text-4xl text-ink-primary dark:text-ink-primary-dark mt-1">
        {babyName} {dday}
      </Text>
    </View>
  );
}
