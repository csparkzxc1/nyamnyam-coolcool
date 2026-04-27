import { useCallback, useRef } from 'react';

import { Animated, Pressable, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

export type NextActionScenario = 'normal' | 'warning' | 'alert' | 'sleeping';

export type NextActionConfidence = 'learning' | 'low' | 'medium' | 'high';

export interface NextActionCardProps {
  scenario: NextActionScenario;
  label: string;
  primary: string;
  primaryEm?: string;
  secondary?: string;
  /**
   * Prediction confidence level. Only the 'learning' case is rendered to the
   * user (as a "🌱 패턴 학습 중" hint); low/medium/high are reserved for
   * internal logic (e.g., deciding whether to schedule a notification) and do
   * not surface in the card.
   */
  confidence?: NextActionConfidence;
  onLongPress?: () => void;
  onPress?: () => void;
}

interface ScenarioConfig {
  gradient: [string, string];
  badgeText: string;
  dotColor: string;
}

// UX-tuned palette: each scenario gets a clearly distinct hue family so the
// card can be recognised in <1s without reading the badge text.
const SCENARIO_CONFIG: Record<NextActionScenario, ScenarioConfig> = {
  normal: {
    // Soft sky blue — calm, ample time, distinct from the orange/coral family.
    gradient: ['#BFD8F5', '#AFCBFF'],
    badgeText: '편안해요',
    dotColor: '#5FCE77',
  },
  warning: {
    // Soft orange — heads-up without alarm.
    gradient: ['#F6C177', '#F2A65A'],
    badgeText: '곧이에요',
    dotColor: '#FFD449',
  },
  alert: {
    // Coral red — clear action prompt, but warm rather than clinical.
    gradient: ['#F28B82', '#E76F51'],
    badgeText: '챙겨주세요',
    dotColor: '#FF6B5E',
  },
  sleeping: {
    // Lavender / dusty rose — entirely separate hue family for sleep.
    gradient: ['#CDB4DB', '#B5838D'],
    badgeText: '자는 중',
    dotColor: '#8B6FD8',
  },
};

const PRESS_IN_CONFIG = { toValue: 0.98, useNativeDriver: true, friction: 7 };
const PRESS_OUT_CONFIG = { toValue: 1, useNativeDriver: true, friction: 7 };

export function NextActionCard({
  scenario,
  label,
  primary,
  primaryEm,
  secondary,
  confidence,
  onLongPress,
  onPress,
}: NextActionCardProps) {
  const config = SCENARIO_CONFIG[scenario];
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, PRESS_IN_CONFIG).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, PRESS_OUT_CONFIG).start();
  }, [scale]);

  const isLearning = confidence === 'learning';

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 22,
            minHeight: 180,
            overflow: 'hidden',
          }}
        >
          {/* Top row: badge */}
          <View className="mb-[14px] flex-row justify-end">
            <View className="flex-row items-center gap-[5px] rounded-full border border-white/25 bg-white/20 px-[11px] py-[5px]">
              <View
                className="h-[6px] w-[6px] rounded-full"
                style={{ backgroundColor: config.dotColor }}
              />
              <Text className="text-[11px] font-semibold tracking-wide text-white/95">
                {config.badgeText}
              </Text>
            </View>
          </View>

          {/* Label */}
          <Text className="mb-[4px] text-[13px] tracking-wide text-white/85">{label}</Text>

          {/* Primary line */}
          <Text className="text-white">
            <Text className="font-display text-[30px] font-medium leading-[34px] tracking-tight">
              {primary}
            </Text>
            {primaryEm ? (
              <Text className="font-display text-[18px] italic text-white/90"> {primaryEm}</Text>
            ) : null}
          </Text>

          {/* Spacer pushes secondary / learning hint to bottom */}
          <View className="flex-1" />

          {/* Learning hint — only shown when confidence is 'learning' */}
          {isLearning ? (
            <Text className="pt-[14px] text-[12px] tracking-wide text-white/90">
              🌱 패턴 학습 중 — 일주일 후부터 더 정확해져요
            </Text>
          ) : null}

          {/* Secondary — hidden when learning hint is shown to avoid clutter */}
          {!isLearning && secondary ? (
            <Text className="pt-[14px] text-[12.5px] leading-[18px] tracking-wide text-white/90">
              {secondary}
            </Text>
          ) : null}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}
