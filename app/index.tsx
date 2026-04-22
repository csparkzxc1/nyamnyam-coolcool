import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/features/auth/api';
import { getBabiesForCurrentUser } from '@/features/babies/api';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Root index — 세션 & 온보딩 상태에 따른 라우팅 허브.
 *
 * - 세션 없음            → /auth/login
 * - 세션 있음 + 아기 없음 → /onboarding/baby-setup
 * - 세션 있음 + 아기 있음 → 홈 플레이스홀더 (Phase 2에서 실제 대시보드로 교체)
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

  // Baby 존재 — 첫 아기를 current로 세팅 (없을 때만)
  const currentBabyId = useSessionStore.getState().currentBabyId;
  if (!currentBabyId) {
    setCurrentBabyId(babies[0].id);
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // onAuthStateChange가 session null 처리 → index 리렌더 → 리다이렉트
    } catch (err) {
      console.error('Sign out failed:', err);
      // TODO: 에러 표시 (다음 태스크에서 Toast/Alert 체계 만들 때)
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page dark:bg-bg-page-dark px-6">
      <View className="flex-1 justify-between py-8">
        <View>
          <Text className="font-display text-4xl text-ink-primary dark:text-ink-primary-dark">
            냠냠쿨쿨
          </Text>
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mt-2">
            {session.user.email}
          </Text>
        </View>

        <View className="items-center">
          <Text className="font-body text-sm text-ink-tertiary dark:text-ink-tertiary-dark">
            홈 화면 (Phase 2에서 구현)
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          className="rounded-md py-3 items-center border border-border-strong dark:border-border-strong-dark"
        >
          <Text className="font-body text-base text-ink-secondary dark:text-ink-secondary-dark">
            로그아웃
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
