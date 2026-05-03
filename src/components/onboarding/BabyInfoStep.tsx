import { useMemo, useState } from 'react';

import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import type { Gender } from '@/features/babies/api';
import { isStep2Valid, useOnboardingStore } from '@/stores/onboardingStore';

export interface BabyInfoStepProps {
  onBack: () => void;
  onNext: () => void;
}

function formatDateLabel(d: Date | null): string {
  if (!d) return '날짜 선택';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${day}.`;
}

function ageHint(birth: Date | null): string | null {
  if (!birth) return null;
  const now = new Date();
  if (birth > now) return '미래 날짜는 선택할 수 없어요';
  const days = Math.floor((now.getTime() - birth.getTime()) / 86_400_000);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return `생후 ${days}일 (D+${String(days).padStart(3, '0')}) · ${months}개월`;
}

/**
 * Step 2 — name + birth date + gender + optional weight.
 *
 * Live age hint right below the date picker is the spec requirement
 * (T203): "생년월일 선택 시 실시간 '생후 N일 · N개월' 계산 표시".
 */
export function BabyInfoStep({ onBack, onNext }: BabyInfoStepProps) {
  const { name, birthDate, gender, weightKg, setBabyInfo } = useOnboardingStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const valid = useMemo(
    () => isStep2Valid({ name, birthDate, gender }),
    [name, birthDate, gender],
  );
  const hint = useMemo(() => ageHint(birthDate), [birthDate]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 32, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text
          className="font-display text-[24px] font-medium"
          style={{ color: '#2A1D12' }}
        >
          우리 아기를 알려주세요
        </Text>
        <Text className="mt-[6px] font-body text-[13px]" style={{ color: '#8A7A63' }}>
          냠냠쿨쿨이 우리 아기에 맞춰 예측해 드릴게요.
        </Text>
      </View>

      {/* Name */}
      <View style={{ gap: 4 }}>
        <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
          이름
        </Text>
        <TextInput
          accessibilityLabel="아기 이름"
          value={name}
          onChangeText={(v) => setBabyInfo({ name: v })}
          placeholder="우리아기"
          placeholderTextColor="#8A7A63"
          maxLength={20}
          style={{
            fontSize: 14,
            color: '#2A1D12',
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        />
      </View>

      {/* Birth date */}
      <View style={{ gap: 4 }}>
        <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
          생년월일
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="생년월일 선택"
          onPress={() => setPickerOpen((v) => !v)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#FAF4EC' : '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 10,
          })}
        >
          <Text
            className="font-body text-[14px]"
            style={{ color: birthDate ? '#2A1D12' : '#8A7A63' }}
          >
            {formatDateLabel(birthDate)}
          </Text>
        </Pressable>
        {hint ? (
          <Text className="font-body text-[12px]" style={{ color: '#5C4A37' }}>
            {hint}
          </Text>
        ) : null}
        {pickerOpen ? (
          <View>
            <DateTimePicker
              value={birthDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={(event: DateTimePickerEvent, selected?: Date) => {
                if (Platform.OS !== 'ios') setPickerOpen(false);
                if (event.type === 'set' && selected) {
                  setBabyInfo({ birthDate: selected });
                }
              }}
            />
          </View>
        ) : null}
      </View>

      {/* Gender */}
      <View style={{ gap: 4 }}>
        <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
          성별
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['male', 'female'] as const).map((g) => {
            const active = gender === g;
            return (
              <Pressable
                key={g}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setBabyInfo({ gender: g as Gender })}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: active ? '#B85428' : pressed ? '#FAF4EC' : '#FFFFFF',
                })}
              >
                <Text
                  className="font-body text-[14px] font-medium"
                  style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                >
                  {g === 'male' ? '남아' : '여아'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Weight (optional) */}
      <View style={{ gap: 4 }}>
        <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
          출생 체중 (선택)
        </Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            accessibilityLabel="출생 체중"
            value={weightKg}
            onChangeText={(v) => setBabyInfo({ weightKg: v })}
            placeholder="3.50"
            placeholderTextColor="#8A7A63"
            keyboardType="decimal-pad"
            style={{
              fontSize: 14,
              color: '#2A1D12',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 12,
              paddingRight: 40,
              borderRadius: 10,
            }}
          />
          <Text
            className="font-body text-[14px]"
            style={{
              color: '#8A7A63',
              position: 'absolute',
              right: 12,
              top: 12,
            }}
          >
            kg
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Footer buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전"
          onPress={onBack}
          style={({ pressed }) => ({
            paddingHorizontal: 18,
            paddingVertical: 14,
            backgroundColor: pressed ? '#EFE4D0' : '#FAF4EC',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text className="font-body text-[14px]" style={{ color: '#5C4A37' }}>
            이전
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음"
          onPress={onNext}
          disabled={!valid}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 14,
            backgroundColor: !valid ? '#D6BFA0' : pressed ? '#9E4621' : '#B85428',
            borderRadius: 12,
            alignItems: 'center',
          })}
        >
          <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
            다음
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
