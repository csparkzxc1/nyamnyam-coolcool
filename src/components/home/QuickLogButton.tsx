import { useCallback, useRef } from 'react';

import { Animated, Pressable, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Bath, Baby, Droplets, Moon } from 'lucide-react-native';

export type QuickLogKind = 'feed' | 'sleep' | 'diaper' | 'bath';

export interface QuickLogButtonProps {
  kind: QuickLogKind;
  isActive: boolean;
  /** "2시간 25분 전" 등 외부에서 포맷한 마지막 시각 텍스트. */
  lastAtText?: string;
  /** isActive일 때만 사용. "00:35" 형식의 진행 중 카운터. */
  activeTimer?: string;
  /** "120ml · 분유" 등 부가 정보. 비어있으면 안 보임. */
  subtitle?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

interface KindConfig {
  label: string;
  iconBg: string; // 평소 아이콘 박스 배경
  activeGradient: [string, string]; // 활성화 시 카드 배경
  Icon: typeof Baby;
}

const KIND_CONFIG: Record<QuickLogKind, KindConfig> = {
  feed: {
    label: '수유',
    iconBg: 'rgba(74, 144, 226, 0.12)',
    activeGradient: ['#74B9FF', '#0984E3'],
    Icon: Baby,
  },
  sleep: {
    label: '수면',
    iconBg: 'rgba(139, 111, 216, 0.12)',
    activeGradient: ['#A29BFE', '#6C5CE7'],
    Icon: Moon,
  },
  diaper: {
    label: '기저귀',
    iconBg: 'rgba(245, 184, 65, 0.15)',
    activeGradient: ['#FFEAA7', '#FDCB6E'],
    Icon: Droplets,
  },
  bath: {
    label: '목욕',
    iconBg: 'rgba(78, 197, 181, 0.12)',
    activeGradient: ['#81ECEC', '#00CEC9'],
    Icon: Bath,
  },
};

const PRESS_IN_CONFIG = { toValue: 0.97, useNativeDriver: true, friction: 7 };
const PRESS_OUT_CONFIG = { toValue: 1, useNativeDriver: true, friction: 7 };

export function QuickLogButton({
  kind,
  isActive,
  lastAtText,
  activeTimer,
  subtitle,
  onPress,
  onLongPress,
}: QuickLogButtonProps) {
  const config = KIND_CONFIG[kind];
  const { Icon } = config;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, PRESS_IN_CONFIG).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, PRESS_OUT_CONFIG).start();
  }, [scale]);

  const inner = (
    <View style={{ minHeight: 88, padding: 16, justifyContent: 'space-between' }}>
      {/* Top row: icon + last time / timer */}
      <View className="flex-row items-start justify-between">
        <View
          className="h-[40px] w-[40px] items-center justify-center rounded-[12px]"
          style={{
            backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : config.iconBg,
          }}
        >
          <Icon
            size={22}
            color={isActive ? '#FFFFFF' : '#2A1D12'}
            strokeWidth={isActive ? 2.2 : 1.8}
          />
        </View>
        <Text
          className="font-mono text-[10px] tracking-wide"
          style={{
            color: isActive ? 'rgba(255,255,255,0.95)' : '#8A7A63',
            marginTop: 2,
          }}
        >
          {isActive ? (activeTimer ?? '00:00') : (lastAtText ?? '처음')}
        </Text>
      </View>

      {/* Bottom: label + subtitle */}
      <View>
        <Text
          className="text-[14px] font-semibold tracking-tight"
          style={{ color: isActive ? '#FFFFFF' : '#2A1D12' }}
        >
          {isActive ? '진행 중' : config.label}
        </Text>
        {subtitle ? (
          <Text
            className="mt-[2px] text-[11px]"
            style={{
              color: isActive ? 'rgba(255,255,255,0.9)' : '#8A7A63',
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? 'rgba(255,255,255,0.35)' : 'rgba(42, 29, 18, 0.08)',
          backgroundColor: isActive ? undefined : '#FFFFFF',
        }}
      >
        {isActive ? (
          <LinearGradient
            colors={config.activeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {inner}
          </LinearGradient>
        ) : (
          inner
        )}
      </Animated.View>
    </Pressable>
  );
}
