import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { requestNotificationPermission } from '@/lib/notifications';
import {
  type OnboardingTone,
  useOnboardingStore,
} from '@/stores/onboardingStore';

export interface NotificationStepProps {
  onBack: () => void;
  onNext: () => void;
}

const TONE_OPTIONS: readonly { value: OnboardingTone; label: string; hint: string }[] = [
  { value: 'chime', label: '부드러운 차임', hint: '낮 추천' },
  { value: 'silent', label: '무음', hint: '배지/잠금화면만' },
  { value: 'vibrate', label: '진동만', hint: '소리 없이' },
];

/**
 * Step 4 — notification preferences + OS permission request.
 *
 * Spec (T204): "iOS/Android 알림 권한 요청은 Step 4 마지막에만".
 * Tapping "다음" triggers the OS prompt; if denied, we still let the
 * user proceed but warn that reminders won't fire.
 */
export function NotificationStep({ onBack, onNext }: NotificationStepProps) {
  const { notificationsEnabled, tone, setNotificationsEnabled, setTone } = useOnboardingStore();

  const handleNext = async () => {
    if (!notificationsEnabled) {
      onNext();
      return;
    }
    try {
      const status = await requestNotificationPermission();
      if (status === 'denied') {
        Alert.alert(
          '알림 권한이 꺼져 있어요',
          '나중에 시스템 설정에서 켤 수 있어요. 권한이 없으면 다음 수유 알림이 오지 않아요.',
          [{ text: '확인', onPress: onNext }],
        );
        return;
      }
      onNext();
    } catch {
      // Native module not available (dev / web) — still advance.
      onNext();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 22, paddingBottom: 32, flexGrow: 1 }}
    >
      <View>
        <Text className="font-display text-[24px] font-medium" style={{ color: '#2A1D12' }}>
          알림을 받아볼까요?
        </Text>
        <Text className="mt-[6px] font-body text-[13px]" style={{ color: '#8A7A63' }}>
          시계 보지 않아도 되도록, 다음 수유와 졸림 신호를 미리 알려드릴게요.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text className="font-body text-[14px] font-medium" style={{ color: '#2A1D12' }}>
            알림 받기
          </Text>
          <Text className="mt-[2px] font-body text-[12px]" style={{ color: '#8A7A63' }}>
            수유 10분 전, 졸림 신호 15분 전, 안전 경고
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ true: '#B85428', false: '#D6BFA0' }}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
          알림 톤
        </Text>
        {TONE_OPTIONS.map((opt) => {
          const active = tone === opt.value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTone(opt.value)}
              disabled={!notificationsEnabled}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 12,
                backgroundColor: active
                  ? '#B85428'
                  : pressed
                    ? '#FAF4EC'
                    : '#FFFFFF',
                opacity: notificationsEnabled ? 1 : 0.4,
              })}
            >
              <Text
                className="font-body text-[14px] font-medium"
                style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
              >
                {opt.label}
              </Text>
              <Text
                className="font-body text-[12px]"
                style={{
                  color: active ? 'rgba(255, 248, 239, 0.85)' : '#8A7A63',
                }}
              >
                {opt.hint}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          backgroundColor: 'rgba(214, 142, 47, 0.10)',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <Text
          className="font-body text-[12px]"
          style={{ color: '#5C4A37', lineHeight: 12 * 1.6 }}
        >
          기본 방해 금지 시간은 22~06시예요. 안전 경고(0~1개월 4시간 룰)만 이 시간에도 울려요.
          시작·종료 시각은 설정 탭에서 바꿀 수 있어요.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전"
          onPress={onBack}
          style={({ pressed }) => ({
            paddingHorizontal: 18,
            paddingVertical: 14,
            backgroundColor: pressed ? '#EFE4D0' : '#FAF4EC',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text className="font-body text-[14px]" style={{ color: '#5C4A37' }}>
            이전
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음"
          onPress={handleNext}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 14,
            backgroundColor: pressed ? '#9E4621' : '#B85428',
            borderRadius: 12,
            alignItems: 'center',
          })}
        >
          <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
            다음
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
