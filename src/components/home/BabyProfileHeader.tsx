import { useCallback, useRef } from 'react';

import { Animated, Pressable, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';

import { formatBabyAge, getBabyInitial } from '@/lib/babyAge';

export interface BabyProfileHeaderProps {
  name: string;
  birthDate: Date;
  /** Number of caregivers including the user. Badge only shown when ≥ 2. */
  caregiverCount?: number;
  onPress?: () => void;
  /** Inject "now" for snapshot tests / Storybook. Defaults to live Date. */
  now?: Date;
}

const PRESS_IN_CONFIG = { toValue: 0.98, useNativeDriver: true, friction: 7 };
const PRESS_OUT_CONFIG = { toValue: 1, useNativeDriver: true, friction: 7 };

export function BabyProfileHeader({
  name,
  birthDate,
  caregiverCount,
  onPress,
  now,
}: BabyProfileHeaderProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, PRESS_IN_CONFIG).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, PRESS_OUT_CONFIG).start();
  }, [scale]);

  const initial = getBabyInitial(name);
  const ageText = formatBabyAge(birthDate, now);
  const showCaregiverBadge = typeof caregiverCount === 'number' && caregiverCount >= 2;

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View
        style={{ transform: [{ scale }] }}
        className="flex-row items-center gap-[12px] px-[4px] py-[12px]"
      >
        {/* Avatar */}
        <LinearGradient
          colors={['#F2D094', '#E8A660', '#C66E7E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            className="font-display text-[18px] font-medium tracking-tight"
            style={{ color: '#FFF8EF' }}
          >
            {initial}
          </Text>
        </LinearGradient>

        {/* Name + age */}
        <View className="flex-1">
          <Text
            className="font-display text-[17px] font-medium tracking-tight"
            style={{ color: '#2A1D12' }}
          >
            {name}
          </Text>
          <Text className="mt-[3px] text-[14px] tracking-wide" style={{ color: '#8A7A63' }}>
            {ageText}
          </Text>
        </View>

        {/* Share badge — only when 2+ caregivers */}
        {showCaregiverBadge ? (
          <View
            className="flex-row items-center gap-[4px] rounded-full px-[10px] py-[6px]"
            style={{ backgroundColor: '#EFE4D0' }}
          >
            <Users size={11} color="#5C4A37" strokeWidth={2} />
            <Text className="text-[11px] font-medium" style={{ color: '#5C4A37' }}>
              {caregiverCount}명
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
