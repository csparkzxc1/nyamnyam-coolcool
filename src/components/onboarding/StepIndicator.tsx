import { Text, View } from 'react-native';

export interface StepIndicatorProps {
  /** 1-based current step. */
  current: number;
  total: number;
}

/**
 * 5-dot progress bar shown at the top of each onboarding step.
 *
 * Filled dots up to and including the current step; remaining steps
 * are hollow. Step counter ("3 / 5") on the right keeps the position
 * legible at a glance without forcing the user to count dots.
 */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < current;
          return (
            <View
              key={i}
              style={{
                width: filled ? 24 : 10,
                height: 6,
                borderRadius: 3,
                backgroundColor: filled ? '#B85428' : '#EFE4D0',
              }}
            />
          );
        })}
      </View>
      <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
        {current} / {total}
      </Text>
    </View>
  );
}
