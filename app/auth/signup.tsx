/**
 * Signup 화면
 *
 * 흐름:
 *   1. 카카오 버튼 → signInWithKakao (첫 OAuth는 가입으로 동작)
 *   2. 이메일 폼 → signUp
 *      - session 있음: 자동 로그인 → '/'로 replace
 *      - session 없음: 이메일 확인 대기 → 안내 후 /auth/login으로 이동
 *
 * 세션 세팅은 app/_layout.tsx의 onAuthStateChange가 담당.
 */

import { useState } from 'react';

import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { signInWithKakao, signUp } from '@/features/auth/api';

export default function SignupScreen() {
  const [loading, setLoading] = useState(false);

  const handleKakao = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithKakao();
      // deep-link 복귀 후 onAuthStateChange가 세션 세팅
    } catch (err) {
      const message = err instanceof Error ? err.message : '카카오 로그인 중 오류가 발생했습니다';
      Alert.alert('가입 실패', message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    try {
      const result = await signUp(values);
      if (result.session) {
        // 이메일 확인 비활성화 프로젝트 — 즉시 로그인 처리됨
        router.replace('/');
      } else {
        // 이메일 확인 필요 — 안내 후 로그인 화면으로
        Alert.alert(
          '이메일을 확인해주세요',
          '입력하신 이메일로 확인 링크를 보냈어요. 링크를 눌러 인증하면 로그인할 수 있어요.',
          [{ text: '확인', onPress: () => router.replace('/auth/login') }],
        );
      }
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
            <Text className="font-display text-4xl text-ink-primary">가입하기</Text>
            <Text className="font-body text-base text-ink-secondary mt-2">
              계정을 만들어 시작해요
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
          <AuthForm mode="signup" onSubmit={handleEmailSubmit} loading={loading} />

          {/* Login link */}
          <View className="flex-row justify-center mt-6">
            <Text className="font-body text-sm text-ink-secondary">이미 계정이 있나요? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity disabled={loading}>
                <Text className="font-body text-sm font-semibold text-ink-primary">로그인</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
