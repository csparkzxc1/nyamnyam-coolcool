import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/features/auth/api';
import { getBabiesForCurrentUser } from '@/features/babies/api';
import { GreetingHeader } from '@/features/home/components/GreetingHeader';
import { QuickActionButtons } from '@/features/home/components/QuickActionButtons';
import { TodaySummaryCard } from '@/features/home/components/TodaySummaryCard';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Root index — 세션 & 온보딩 상태에 따른 라우팅 허브.
 *
 * - 세션 없음            → /auth/login
 * - 세션 있음 + 아기 없음 → /onboarding/baby-setup
 * - 세션 있음 + 아기 있음 → 홈 화면 (Phase 2-1: skeleton)
 */
export default function Index() {
  const session = useSessionStore((s) => s.session);
  const setCurrentBabyId = useSessionStore((s) => s.setCurrentBabyId);

  const babiesQuery = useQuery({
    queryKey: ['babies', 'current-user'],
    queryFn: getBabiesForCurrentUser,
    enabled: !!session,
  });

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  if (babiesQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page dark:bg-bg-page-dark">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (babiesQuery.isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page dark:bg-bg-page-dark px-6">
        <Text className="font-body text-sm text-accent-sienna text-center">
          아기 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </Text>
      </SafeAreaView>
    );
  }

  const babies = babiesQuery.data ?? [];

  if (babies.length === 0) {
    return <Redirect href="/onboarding/baby-setup" />;
  }

  const baby = babies[0];

  // 첫 아기를 current로 세팅 (없을 때만)
  const currentBabyId = useSessionStore.getState().currentBabyId;
  if (!currentBabyId) {
    setCurrentBabyId(baby.id);
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page dark:bg-bg-page-dark">
      <View className="flex-1">
        <GreetingHeader babyName={baby.name} birthDateIso={baby.birth_date} />
        <TodaySummaryCard feedingCount={0} sleepCount={0} lastRecordLabel={null} />
        <QuickActionButtons />
        <View className="flex-1" />
        <View className="px-6 pb-2 items-center">
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
            <Text className="font-body text-xs text-ink-tertiary dark:text-ink-tertiary-dark underline">
              로그아웃
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
