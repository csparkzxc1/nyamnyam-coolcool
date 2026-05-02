import { useEffect, useState } from 'react';

import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { format } from 'date-fns';

import type { Baby, BabyUpdate } from '@/features/logging/api';

export interface BabyEditModalProps {
  baby: Baby | null;
  /** True while the update mutation is in flight. */
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (patch: BabyUpdate) => void;
}

const FEEDING_OPTIONS: readonly { value: 'breast' | 'formula' | 'mixed'; label: string }[] = [
  { value: 'breast', label: '모유' },
  { value: 'formula', label: '분유' },
  { value: 'mixed', label: '혼합' },
];

const GENDER_OPTIONS: readonly { value: 'M' | 'F' | null; label: string }[] = [
  { value: null, label: '미선택' },
  { value: 'M', label: '남' },
  { value: 'F', label: '여' },
];

/**
 * Bottom-sheet modal for editing baby profile (name, birth date,
 * gender, weight, feeding type). Renders as a centred card on tablet
 * because RN Modal's animationType="slide" looks weird on iPad.
 *
 * The DatePicker (T303 spec) is intentionally simple — the user
 * types YYYY-MM-DD. A native picker would be nicer but adds another
 * dependency for a screen used once a month.
 */
export function BabyEditModal({ baby, isSubmitting, onClose, onSave }: BabyEditModalProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [weight, setWeight] = useState('');
  const [feeding, setFeeding] = useState<'breast' | 'formula' | 'mixed'>('breast');

  // Re-seed form fields each time a different baby is opened.
  useEffect(() => {
    if (!baby) return;
    setName(baby.name);
    setBirthDate(format(new Date(baby.birth_date), 'yyyy-MM-dd'));
    setGender(baby.gender === 'M' || baby.gender === 'F' ? baby.gender : null);
    setWeight(baby.weight_kg !== null ? String(baby.weight_kg) : '');
    setFeeding(
      baby.feeding_type === 'breast' || baby.feeding_type === 'formula' || baby.feeding_type === 'mixed'
        ? baby.feeding_type
        : 'breast',
    );
  }, [baby]);

  const handleSave = () => {
    if (!baby) return;
    if (name.trim().length === 0) {
      Alert.alert('이름을 입력해 주세요');
      return;
    }
    const parsedDate = new Date(birthDate);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
      Alert.alert('생년월일을 올바르게 입력해 주세요 (YYYY-MM-DD).');
      return;
    }
    const w = weight.trim() === '' ? null : Number(weight);
    if (w !== null && (Number.isNaN(w) || w <= 0 || w > 30)) {
      Alert.alert('체중은 0~30 kg 사이로 입력해 주세요.');
      return;
    }
    onSave({
      name: name.trim(),
      birth_date: format(parsedDate, 'yyyy-MM-dd'),
      gender,
      weight_kg: w,
      feeding_type: feeding,
    });
  };

  return (
    <Modal
      visible={baby !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            gap: 14,
            paddingBottom: 28,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text className="font-display text-[18px] font-medium" style={{ color: '#2A1D12' }}>
              아기 정보 편집
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="닫기"
              onPress={onClose}
              hitSlop={10}
            >
              <Text className="font-body text-[14px]" style={{ color: '#8A7A63' }}>
                취소
              </Text>
            </Pressable>
          </View>

          {/* Name */}
          <View style={{ gap: 4 }}>
            <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
              이름
            </Text>
            <TextInput
              accessibilityLabel="아기 이름"
              value={name}
              onChangeText={setName}
              placeholder="우리아기"
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

          {/* Birth date */}
          <View style={{ gap: 4 }}>
            <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
              생년월일 (YYYY-MM-DD)
            </Text>
            <TextInput
              accessibilityLabel="생년월일"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="2026-04-01"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
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

          {/* Gender */}
          <View style={{ gap: 4 }}>
            <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
              성별
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {GENDER_OPTIONS.map((opt) => {
                const active = gender === opt.value;
                return (
                  <Pressable
                    key={opt.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setGender(opt.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: active ? '#B85428' : pressed ? '#EFE4D0' : '#FAF4EC',
                    })}
                  >
                    <Text
                      className="font-body text-[12px] font-medium"
                      style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Feeding type */}
          <View style={{ gap: 4 }}>
            <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
              수유 방식
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {FEEDING_OPTIONS.map((opt) => {
                const active = feeding === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFeeding(opt.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: active ? '#B85428' : pressed ? '#EFE4D0' : '#FAF4EC',
                    })}
                  >
                    <Text
                      className="font-body text-[12px] font-medium"
                      style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Weight */}
          <View style={{ gap: 4 }}>
            <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
              체중 (kg) — 선택
            </Text>
            <TextInput
              accessibilityLabel="체중"
              value={weight}
              onChangeText={setWeight}
              placeholder="3.5"
              keyboardType="decimal-pad"
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="저장"
            onPress={handleSave}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              marginTop: 6,
              backgroundColor: isSubmitting ? '#D6BFA0' : pressed ? '#9E4621' : '#B85428',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
            })}
          >
            <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
              {isSubmitting ? '저장 중…' : '저장하기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
