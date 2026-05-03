import { Pressable, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

export interface WelcomeStepProps {
  onNext: () => void;
}

/**
 * Step 1 — full-screen hero. The "skip" path is intentionally removed
 * (T203 spec: "스킵 불가") because finishing the wizard creates the
 * baby record the rest of the app depends on.
 */
export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <LinearGradient
      colors={['#F2D094', '#E8A660', '#C66E7E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}
    >
      <View />

      <View style={{ alignItems: 'center', gap: 14 }}>
        <Text style={{ fontSize: 64 }}>🍼</Text>
        <Text
          className="font-display text-[28px] font-medium"
          style={{ color: '#FFF8EF', textAlign: 'center', lineHeight: 36 }}
        >
          냠냠쿨쿨에{'\n'}오신 걸 환영해요
        </Text>
        <Text
          className="font-body text-[14px]"
          style={{ color: '#FFF8EF', textAlign: 'center', opacity: 0.85, lineHeight: 22 }}
        >
          시계 보지 마세요.{'\n'}다음 수유, 다음 잠을{'\n'}냠냠쿨쿨이 미리 알려드릴게요.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="시작하기"
        onPress={onNext}
        style={({ pressed }) => ({
          backgroundColor: pressed ? 'rgba(255, 248, 239, 0.85)' : '#FFF8EF',
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
        })}
      >
        <Text className="font-body text-[15px] font-medium" style={{ color: '#B85428' }}>
          시작하기
        </Text>
      </Pressable>
    </LinearGradient>
  );
}
