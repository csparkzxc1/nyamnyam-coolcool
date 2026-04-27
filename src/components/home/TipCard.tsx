import { Platform, Text, View } from 'react-native';

export interface TipCardProps {
  /** Card header label (e.g., "오늘의 응원", "오늘의 작은 팁"). */
  label: string;
  /** Main body text. 2–3 lines fit best. */
  message: string;
  /** Leading emoji or short symbol. Defaults to "🌿". */
  icon?: string;
}

/**
 * Soft, warm card used for daily encouragement and tips on the home screen.
 *
 * Visual choice: a clean white card lifted off the page background by a soft
 * shadow, with the leading emoji rendered larger on the left to keep visual
 * hierarchy without needing an icon "bubble". The TipCard is mood, not
 * information — caregivers should glance at it for warmth, not act on it.
 * The white surface deliberately separates it from the stronger gradient
 * cards above (NextActionCard) so the eye lands on it as a quiet ending,
 * not as another signal.
 */
export function TipCard({ label, message, icon = '🌿' }: TipCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        ...Platform.select({
          ios: {
            shadowColor: '#2A1D12',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
          android: {
            elevation: 2,
          },
        }),
      }}
    >
      <View className="flex-row items-start gap-[14px]">
        {/* Leading emoji — larger, no bubble */}
        <Text className="text-[26px]" style={{ lineHeight: 30 }}>
          {icon}
        </Text>

        {/* Label + message */}
        <View className="flex-1">
          <Text className="font-display text-[13px] tracking-wide" style={{ color: '#8A6A3D' }}>
            {label}
          </Text>
          <Text className="mt-[6px] text-[14px] leading-[20px]" style={{ color: '#3A2E1F' }}>
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
}
