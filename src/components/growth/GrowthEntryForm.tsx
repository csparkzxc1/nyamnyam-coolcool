import { useState } from 'react';

import { Pressable, Text, TextInput, View } from 'react-native';

export interface GrowthEntryValues {
  weightKg: number | null;
  heightCm: number | null;
  measuredAt: Date;
}

export interface GrowthEntryFormProps {
  /** Disabled state during the create mutation. */
  isSubmitting?: boolean;
  onSubmit: (values: GrowthEntryValues) => void;
}

/**
 * Inline "add measurement" form for the Guide tab. Two text fields
 * (weight, height) plus a single submit button — minimum surface area
 * because most caregivers add a row right after a checkup, where they
 * already have the numbers in mind.
 *
 * Uses 'decimal-pad' inputs so the keyboard surfaces a numeric strip;
 * client-side parse rejects empty / non-numeric entries before the
 * mutation fires.
 */
export function GrowthEntryForm({ isSubmitting, onSubmit }: GrowthEntryFormProps) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const w = weight.trim() === '' ? null : Number(weight);
    const h = height.trim() === '' ? null : Number(height);

    // Validation: at least one numeric value required, and any provided
    // value must parse cleanly.
    if (w === null && h === null) {
      setError('몸무게나 키 중 하나는 입력해 주세요.');
      return;
    }
    if (w !== null && (Number.isNaN(w) || w <= 0 || w > 30)) {
      setError('몸무게는 0~30 kg 사이로 입력해 주세요.');
      return;
    }
    if (h !== null && (Number.isNaN(h) || h <= 0 || h > 130)) {
      setError('키는 0~130 cm 사이로 입력해 주세요.');
      return;
    }

    setError(null);
    onSubmit({
      weightKg: w,
      heightCm: h,
      measuredAt: new Date(),
    });
    setWeight('');
    setHeight('');
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <Text
        className="font-display text-[14px] font-medium"
        style={{ color: '#2A1D12' }}
      >
        오늘의 측정 추가
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
            몸무게 (kg)
          </Text>
          <TextInput
            accessibilityLabel="몸무게 (kg)"
            placeholder="6.5"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            editable={!isSubmitting}
            style={{
              fontSize: 14,
              color: '#2A1D12',
              backgroundColor: '#FAF4EC',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          />
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
            키 (cm)
          </Text>
          <TextInput
            accessibilityLabel="키 (cm)"
            placeholder="62"
            keyboardType="decimal-pad"
            value={height}
            onChangeText={setHeight}
            editable={!isSubmitting}
            style={{
              fontSize: 14,
              color: '#2A1D12',
              backgroundColor: '#FAF4EC',
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          />
        </View>
      </View>

      {error ? (
        <Text className="font-body text-[12px]" style={{ color: '#B85428' }}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="측정 기록 추가"
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={({ pressed }) => ({
          backgroundColor: isSubmitting ? '#D6BFA0' : pressed ? '#9E4621' : '#B85428',
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
        })}
      >
        <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
          {isSubmitting ? '저장 중…' : '기록 추가'}
        </Text>
      </Pressable>
    </View>
  );
}
