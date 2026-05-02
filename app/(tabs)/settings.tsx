import { useEffect } from 'react';

import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsRow } from '@/components/settings/SettingsRow';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';
import { getScheduler } from '@/features/notifications/runtime';
import {
  useNotificationSettingsStore,
  type NotificationTone,
} from '@/stores/notificationSettingsStore';

const TONE_LABEL: Record<NotificationTone, string> = {
  chime: '부드러운 차임',
  silent: '무음',
  vibrate: '진동만',
};

const TONES: readonly NotificationTone[] = ['chime', 'silent', 'vibrate'];

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

export default function SettingsScreen() {
  const settings = useNotificationSettingsStore();

  // Initial permission probe — tells the user whether the OS still
  // grants notification access. Probing is read-only, never prompts.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await getNotificationPermission();
        if (active) settings.setPermission(status);
      } catch {
        /* native module unavailable in dev — ignore */
      }
    })();
    return () => {
      active = false;
    };
    // We intentionally only probe on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestPermission = async () => {
    try {
      const status = await requestNotificationPermission();
      settings.setPermission(status);
      if (status === 'denied') {
        Alert.alert(
          '알림 권한이 꺼져 있어요',
          '시스템 설정 > 앱에서 알림을 켜야 다음 수유·수면 알림을 받을 수 있어요.',
        );
      }
    } catch {
      Alert.alert('알림 설정 실패', '잠시 후 다시 시도해 주세요.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await getScheduler().schedule({
        id: 'feed-reminder',
        channel: 'normal',
        title: '🔔 테스트 알림',
        body: '알림이 정상적으로 전달되고 있어요',
        triggerAt: new Date(Date.now() + 5_000),
      });
      Alert.alert('테스트 알림 예약됨', '5초 후 알림이 도착해요.');
    } catch {
      Alert.alert('전송 실패', '알림 전송에 실패했어요.');
    }
  };

  const cycleDndStart = () => {
    const next = (settings.dnd.startHour + 1) % 24;
    settings.setDnd({ ...settings.dnd, startHour: next });
  };
  const cycleDndEnd = () => {
    const next = (settings.dnd.endHour + 1) % 24;
    settings.setDnd({ ...settings.dnd, endHour: next });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text
            className="font-body text-[11px] uppercase tracking-[2px]"
            style={{ color: '#8A7A63' }}
          >
            알림
          </Text>
          <Text
            className="mt-[2px] font-display text-[20px] font-medium"
            style={{ color: '#2A1D12' }}
          >
            알림 설정
          </Text>
        </View>

        {settings.permission !== 'granted' ? (
          <View
            style={{
              backgroundColor: 'rgba(184, 84, 40, 0.08)',
              borderRadius: 12,
              padding: 14,
              gap: 8,
            }}
          >
            <Text className="font-body text-[13px]" style={{ color: '#B85428' }}>
              알림 권한이 필요해요. 권한을 허용해야 다음 수유·수면 알림을 받을 수 있어요.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleRequestPermission}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#9E4621' : '#B85428',
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: 'center',
              })}
            >
              <Text className="font-body text-[13px] font-medium" style={{ color: '#FFF8EF' }}>
                권한 요청하기
              </Text>
            </Pressable>
          </View>
        ) : null}

        <SettingsRow
          label="알림 사용"
          description="모든 알림을 한 번에 켜고 끄기"
          toggle={{ value: settings.enabled, onValueChange: settings.setEnabled }}
        />

        <SettingsRow
          label="수유 알림"
          description="다음 수유 예상 10분 전 알림"
          toggle={{
            value: settings.feedRemindersEnabled,
            onValueChange: settings.setFeedReminders,
          }}
        />

        <SettingsRow
          label="수면 알림"
          description="졸림 신호 타이밍 15분 전 알림"
          toggle={{
            value: settings.sleepRemindersEnabled,
            onValueChange: settings.setSleepReminders,
          }}
        />

        <View>
          <Text
            className="mt-[8px] font-body text-[11px] uppercase tracking-[2px]"
            style={{ color: '#8A7A63' }}
          >
            방해 금지
          </Text>
        </View>

        <SettingsRow
          label="시작 시각"
          description="이 시각 이후로는 안전 경고만 알림"
          onPress={cycleDndStart}
        >
          <Text className="font-display text-[16px] font-medium" style={{ color: '#B85428' }}>
            {formatHour(settings.dnd.startHour)}
          </Text>
        </SettingsRow>

        <SettingsRow
          label="종료 시각"
          description="이 시각부터 일반 알림 재개"
          onPress={cycleDndEnd}
        >
          <Text className="font-display text-[16px] font-medium" style={{ color: '#B85428' }}>
            {formatHour(settings.dnd.endHour)}
          </Text>
        </SettingsRow>

        <View>
          <Text
            className="mt-[8px] font-body text-[11px] uppercase tracking-[2px]"
            style={{ color: '#8A7A63' }}
          >
            톤
          </Text>
        </View>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 6,
            flexDirection: 'row',
            gap: 4,
          }}
        >
          {TONES.map((tone) => {
            const active = settings.tone === tone;
            return (
              <Pressable
                key={tone}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => settings.setTone(tone)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: active
                    ? '#B85428'
                    : pressed
                      ? 'rgba(42, 29, 18, 0.04)'
                      : 'transparent',
                })}
              >
                <Text
                  className="font-body text-[13px] font-medium"
                  style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                >
                  {TONE_LABEL[tone]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="테스트 알림 보내기"
          onPress={handleTestNotification}
          style={({ pressed }) => ({
            marginTop: 8,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
            borderWidth: 1,
            borderColor: 'rgba(42, 29, 18, 0.08)',
          })}
        >
          <Text className="font-body text-[13px] font-medium" style={{ color: '#B85428' }}>
            🔔 테스트 알림 보내기
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
