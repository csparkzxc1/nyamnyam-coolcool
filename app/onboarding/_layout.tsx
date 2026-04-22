import { Stack } from 'expo-router';

/**
 * Onboarding layout — 첫 가입 후 진행되는 필수 플로우.
 *
 * - 헤더 숨김 (루트에서도 꺼져 있지만 명시적으로)
 * - 스와이프 뒤로가기 비활성화 (온보딩 스킵 방지)
 * - 배경색 통일 (bg-page 미색)
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: '#F4EBDC' },
      }}
    />
  );
}
