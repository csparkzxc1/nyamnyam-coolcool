import { useState } from 'react';

import { Modal, Pressable, Text, View } from 'react-native';

import { AlertTriangle, ChevronRight, X } from 'lucide-react-native';

import type { Anomaly, AnomalySeverity } from '@/features/anomalies/detect';

const TONE: Record<
  AnomalySeverity,
  { bg: string; ink: string; iconColor: string; label: string }
> = {
  critical: {
    bg: 'rgba(184, 84, 40, 0.12)',
    ink: '#8E3F1F',
    iconColor: '#B85428',
    label: '주의',
  },
  warning: {
    bg: 'rgba(214, 142, 47, 0.14)',
    ink: '#7C5316',
    iconColor: '#D68E2F',
    label: '확인',
  },
  info: {
    bg: 'rgba(110, 133, 101, 0.16)',
    ink: '#3F4F39',
    iconColor: '#6E8565',
    label: '참고',
  },
};

export interface AnomalyBannerProps {
  anomaly: Anomaly;
  /** Called when user taps the X. Critical anomalies should hide the X. */
  onDismiss?: () => void;
}

/**
 * Single anomaly banner shown at the top of the home screen. Tap the
 * body to expand a modal with the full detail + 소아과 상담 hint;
 * tap X to dismiss (24h hide, except for critical).
 *
 * Critical anomalies render the X hidden so the caregiver has to deal
 * with the underlying issue rather than the alert. (T901 acceptance
 * criteria #2.)
 */
export function AnomalyBanner({ anomaly, onDismiss }: AnomalyBannerProps) {
  const [showDetail, setShowDetail] = useState(false);
  const tone = TONE[anomaly.severity];
  const allowDismiss = anomaly.severity !== 'critical' && !!onDismiss;

  return (
    <>
      <View
        accessibilityRole="alert"
        accessibilityLabel={`${tone.label} ${anomaly.message}`}
        style={{
          backgroundColor: tone.bg,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          gap: 10,
        }}
      >
        <AlertTriangle size={18} color={tone.iconColor} strokeWidth={2} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${anomaly.message} 자세히 보기`}
          onPress={() => setShowDetail(true)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <View style={{ flex: 1 }}>
            <Text className="font-body text-[10px] font-medium uppercase tracking-[1.5px]" style={{ color: tone.iconColor }}>
              {tone.label}
            </Text>
            <Text className="font-body text-[13px] font-medium" style={{ color: tone.ink, marginTop: 2 }}>
              {anomaly.message}
            </Text>
          </View>
          <ChevronRight size={16} color={tone.ink} />
        </Pressable>

        {allowDismiss ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림 닫기"
            hitSlop={10}
            onPress={onDismiss}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <X size={16} color={tone.ink} />
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={showDetail}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDetail(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              gap: 12,
              width: '100%',
              maxWidth: 360,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} color={tone.iconColor} />
              <Text
                className="font-display text-[18px] font-medium"
                style={{ color: '#2A1D12' }}
              >
                {anomaly.message}
              </Text>
            </View>
            <Text
              className="font-body text-[14px]"
              style={{ color: '#5C4A37', lineHeight: 14 * 1.6 }}
            >
              {anomaly.detail}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="확인하고 닫기"
              onPress={() => setShowDetail(false)}
              style={({ pressed }) => ({
                marginTop: 6,
                backgroundColor: pressed ? '#D68E2F' : '#B85428',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              })}
            >
              <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
                확인했어요
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
