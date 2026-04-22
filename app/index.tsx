// app/index.tsx
// 책임: 세션 가드 + 홈 플레이스홀더
// 동작:
//   - 세션 있음: 이메일 + 로그아웃 버튼
//   - 세션 없음: useEffect에서 /auth/login 리다이렉트

import { useEffect } from 'react';

import { Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME } from '@/constants/config';
import { signOut } from '@/features/auth/api';
import { useSessionStore } from '@/stores/sessionStore';

export default function Index() {
  const session = useSessionStore((s) => s.session);

  useEffect(() => {
    if (!session) {
      router.replace('/auth/login');
    }
  }, [session]);

  // 세션 없으면 리다이렉트 중 — 빈 배경만
  if (!session) {
    return <View className="flex-1 bg-bg-page" />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      // onAuthStateChange가 세션 null 처리 → index 리렌더 → 리다이렉트
    } catch (err) {
      console.error('Sign out failed:', err);
      // TODO: 에러 표시 (다음 태스크에서 Toast/Alert 체계 만들 때)
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-12">
        <Text className="font-display text-4xl text-ink-primary">{APP_NAME}</Text>
        <Text className="font-body text-sm text-ink-secondary mt-2">{session.user.email}</Text>

        {/* Placeholder */}
        <View className="flex-1 items-center justify-center">
          <Text className="font-body text-ink-tertiary">홈 화면 (Phase 2에서 구현)</Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          className="rounded-md py-3 items-center border border-border-strong mb-6"
        >
          <Text className="font-body text-base text-ink-secondary">로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
