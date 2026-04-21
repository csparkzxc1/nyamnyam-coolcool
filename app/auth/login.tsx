/**
 * Login 화면
 *
 * 흐름:
 *   1. 카카오 버튼 → signInWithKakao (OAuth, deep-link으로 복귀)
 *   2. 이메일 폼 → signIn → 성공 시 '/'로 replace
 *
 * 세션 세팅은 app/_layout.tsx의 onAuthStateChange가 담당.
 * 이 화면은 API 호출 + 라우팅만 책임짐.
 */

import { useState } from 'react';

import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { signIn, signInWithKakao } from '@/features/auth/api';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleKakao = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithKakao();
      // deep-link 복귀 후 onAuthStateChange가 세션 세팅 → 라우팅은 _layout에서
    } catch (err) {
      const message = err instanceof Error ? err.message : '카카오 로그인 중 오류가 발생했습니다';
      Alert.alert('로그인 실패', message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      await signIn(values);
      router.replace('/');
    } finally {
      setLoading(false);
    }
    // 에러는 throw — AuthForm이 form-level로 표시
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-12 pb-6">
          {/* Headline */}
          <View className="mb-10">
            <Text className="font-display text-4xl text-ink-primary">냠냠쿨쿨</Text>
            <Text className="font-body text-base text-ink-secondary mt-2">
              한 끼의 온도를 기록해요
            </Text>
          </View>

          {/* Kakao button — 강조 */}
          <TouchableOpacity
            onPress={handleKakao}
            disabled={loading}
            activeOpacity={0.85}
            className={`rounded-md py-4 items-center bg-brand-kakao mb-6 ${
              loading ? 'opacity-50' : ''
            }`}
          >
            <Text className="font-body text-base font-semibold text-brand-kakao-ink">
              카카오로 시작하기
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-border-subtle" />
            <Text className="font-body text-xs text-ink-tertiary mx-3">또는</Text>
            <View className="flex-1 h-px bg-border-subtle" />
          </View>

          {/* Email form — 보조 */}
          <AuthForm mode="login" onSubmit={handleEmailSubmit} loading={loading} />

          {/* Sign-up link */}
          <View className="flex-row justify-center mt-6">
            <Text className="font-body text-sm text-ink-secondary">계정이 없나요? </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity disabled={loading}>
                <Text className="font-body text-sm font-semibold text-ink-primary">가입하기</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
