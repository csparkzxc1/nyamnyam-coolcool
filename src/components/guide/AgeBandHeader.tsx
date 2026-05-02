import { Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { formatBabyAge } from '@/lib/babyAge';

export interface AgeBandHeaderProps {
  babyName: string;
  birthDate: Date;
  /** Korean-formatted age band the baby currently falls into (e.g. "1~3개월"). */
  currentBandLabel: string;
  /** Inject "now" for tests; defaults to live Date inside formatBabyAge. */
  now?: Date;
}

/**
 * Page header for the Guide tab. Echoes the baby's age and surfaces the
 * current month band so the rest of the page reads as "this is where my
 * baby is right now."
 */
export function AgeBandHeader({
  babyName,
  birthDate,
  currentBandLabel,
  now,
}: AgeBandHeaderProps) {
  return (
    <LinearGradient
      colors={['#F2D094', '#E8A660']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 20,
        padding: 18,
      }}
    >
      <Text className="font-body text-[12px] tracking-wide" style={{ color: '#FFF8EF' }}>
        {babyName}의 월령
      </Text>
      <Text
        className="mt-[6px] font-display text-[28px] font-medium tracking-tight"
        style={{ color: '#FFF8EF' }}
      >
        {currentBandLabel}
      </Text>
      <View className="mt-[10px] flex-row items-center gap-[8px]">
        <View
          className="rounded-full px-[10px] py-[4px]"
          style={{ backgroundColor: 'rgba(255, 248, 239, 0.25)' }}
        >
          <Text className="text-[11px] font-medium" style={{ color: '#FFF8EF' }}>
            {formatBabyAge(birthDate, now)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
