/**
 * Baby setup onboarding screen
 *
 * 책임:
 *   - 아기 프로필 입력 수집 (이름, 생일, 성별, 수유 방식, 출생 체중)
 *   - zod 검증
 *   - createBaby 호출
 *   - 성공 시 세션 스토어에 currentBabyId 세팅 후 홈 이동
 *
 * 진입 경로: app/index.tsx에서 세션 있음 + babies 없음 감지 시 리다이렉트.
 * 중간 이탈 금지: _layout.tsx에서 뒤로 제스처 비활성화.
 */

import { useMemo, useState } from 'react';

import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { createBaby, type FeedingType, type Gender } from '@/features/babies/api';
import { useSessionStore } from '@/stores/sessionStore';

// ============================================================
// Schema
// ============================================================

const schema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요').max(20, '20자 이내로 입력해주세요'),
  birthDate: z
    .date({ message: '생년월일을 선택해주세요' })
    .refine((d) => d <= new Date(), { message: '미래 날짜는 선택할 수 없어요' })
    .refine(
      (d) => {
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        return d >= tenYearsAgo;
      },
      { message: '너무 오래된 날짜예요' },
    ),
  gender: z.enum(['male', 'female'], { message: '성별을 선택해주세요' }),
  feedingType: z.enum(['breast', 'formula', 'mixed'], {
    message: '수유 방식을 선택해주세요',
  }),
  weightKg: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1}(\.\d{1,2})?$/.test(v.trim()), {
      message: '0.0 ~ 9.99 사이 숫자로 입력해주세요 (예: 3.50)',
    }),
});

type FormValues = z.infer<typeof schema>;

// ============================================================
// Helpers
// ============================================================

function formatDateLabel(date: Date | undefined): string {
  if (!date) return '날짜 선택';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${d}.`;
}

function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateAgeLabel(birthDate: Date | undefined): string | null {
  if (!birthDate) return null;
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.floor((now.getTime() - birthDate.getTime()) / msPerDay);
  if (days < 0) return null;

  // 개월수: 만 개월 계산
  let months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
  if (now.getDate() < birthDate.getDate()) months -= 1;

  const leftoverDate = new Date(birthDate);
  leftoverDate.setMonth(leftoverDate.getMonth() + months);
  const leftoverDays = Math.floor((now.getTime() - leftoverDate.getTime()) / msPerDay);

  return `오늘로 D+${days} (${months}개월 ${leftoverDays}일)`;
}

// ============================================================
// Screen
// ============================================================

export default function BabySetupScreen() {
  const setCurrentBabyId = useSessionStore((s) => s.setCurrentBabyId);
  const [formError, setFormError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      gender: undefined,
      feedingType: 'mixed',
      weightKg: '',
    },
  });

  const birthDate = watch('birthDate');
  const ageLabel = useMemo(() => calculateAgeLabel(birthDate), [birthDate]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const parsedWeight =
        values.weightKg && values.weightKg.trim() !== '' ? Number(values.weightKg) : null;
      return createBaby({
        name: values.name,
        birthDate: formatDateIso(values.birthDate),
        gender: values.gender as Gender,
        feedingType: values.feedingType as FeedingType,
        weightKg: parsedWeight,
      });
    },
    onSuccess: (baby) => {
      setCurrentBabyId(baby.id);
      router.replace('/');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : '저장에 실패했어요';
      setFormError(msg);
    },
  });

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    mutation.mutate(values);
  };

  const isDisabled = isSubmitting || mutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-bg-page dark:bg-bg-page-dark">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="px-6"
      >
        {/* Heading */}
        <View className="mt-10 mb-8">
          <Text className="font-display text-4xl text-ink-primary dark:text-ink-primary-dark">
            아기를 알려주세요
          </Text>
          <Text className="font-body text-base text-ink-secondary dark:text-ink-secondary-dark mt-2">
            냠냠쿨쿨이 맞춰갈게요
          </Text>
        </View>

        {/* Form error */}
        {formError ? (
          <View className="mb-4 rounded-md border border-accent-sienna bg-bg-muted dark:bg-bg-muted-dark px-3 py-2">
            <Text className="font-body text-sm text-accent-sienna">{formError}</Text>
          </View>
        ) : null}

        {/* Name */}
        <View className="mb-5">
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1">
            이름
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="태명도 괜찮아요 (예: 사랑이)"
                placeholderTextColor="#8A7A63"
                editable={!isDisabled}
                maxLength={20}
                className="font-body text-base text-ink-primary dark:text-ink-primary-dark bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark rounded-md px-3 py-3"
              />
            )}
          />
          {errors.name ? (
            <Text className="font-body text-xs text-accent-sienna mt-1">{errors.name.message}</Text>
          ) : null}
        </View>

        {/* Birth date */}
        <View className="mb-5">
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1">
            생년월일
          </Text>
          <TouchableOpacity
            onPress={() => setDatePickerOpen((v) => !v)}
            disabled={isDisabled}
            activeOpacity={0.8}
            className="bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark rounded-md px-3 py-3"
          >
            <Text
              className={`font-body text-base ${
                birthDate
                  ? 'text-ink-primary dark:text-ink-primary-dark'
                  : 'text-ink-tertiary dark:text-ink-tertiary-dark'
              }`}
            >
              {formatDateLabel(birthDate)}
            </Text>
          </TouchableOpacity>
          {ageLabel ? (
            <Text className="font-body text-xs text-ink-secondary dark:text-ink-secondary-dark mt-1">
              {ageLabel}
            </Text>
          ) : null}
          {errors.birthDate ? (
            <Text className="font-body text-xs text-accent-sienna mt-1">
              {errors.birthDate.message}
            </Text>
          ) : null}
          {datePickerOpen ? (
            <View className="mt-2">
              <DateTimePicker
                value={birthDate ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={new Date()}
                onChange={(event: DateTimePickerEvent, selected?: Date) => {
                  if (Platform.OS !== 'ios') {
                    setDatePickerOpen(false);
                  }
                  if (event.type === 'set' && selected) {
                    setValue('birthDate', selected, { shouldValidate: true });
                  }
                }}
              />
            </View>
          ) : null}
        </View>

        {/* Gender */}
        <View className="mb-5">
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-2">
            성별
          </Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-3">
                {(['male', 'female'] as const).map((g) => {
                  const selected = value === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => onChange(g)}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                      className={`flex-1 rounded-md py-3 items-center border ${
                        selected
                          ? 'bg-ink-primary dark:bg-ink-primary-dark border-ink-primary dark:border-ink-primary-dark'
                          : 'bg-bg-surface dark:bg-bg-surface-dark border-border-subtle dark:border-border-subtle-dark'
                      }`}
                    >
                      <Text
                        className={`font-body text-base ${
                          selected
                            ? 'text-ink-on-accent dark:text-bg-page-dark font-semibold'
                            : 'text-ink-primary dark:text-ink-primary-dark'
                        }`}
                      >
                        {g === 'male' ? '남아' : '여아'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          {errors.gender ? (
            <Text className="font-body text-xs text-accent-sienna mt-1">
              {errors.gender.message}
            </Text>
          ) : null}
        </View>

        {/* Feeding type */}
        <View className="mb-5">
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-2">
            수유 방식
          </Text>
          <Controller
            control={control}
            name="feedingType"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-3">
                {(['breast', 'formula', 'mixed'] as const).map((t) => {
                  const selected = value === t;
                  const label = t === 'breast' ? '모유' : t === 'formula' ? '분유' : '혼합';
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => onChange(t)}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                      className={`flex-1 rounded-md py-3 items-center border ${
                        selected
                          ? 'bg-ink-primary dark:bg-ink-primary-dark border-ink-primary dark:border-ink-primary-dark'
                          : 'bg-bg-surface dark:bg-bg-surface-dark border-border-subtle dark:border-border-subtle-dark'
                      }`}
                    >
                      <Text
                        className={`font-body text-base ${
                          selected
                            ? 'text-ink-on-accent dark:text-bg-page-dark font-semibold'
                            : 'text-ink-primary dark:text-ink-primary-dark'
                        }`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
          <Text className="font-body text-xs text-ink-tertiary dark:text-ink-tertiary-dark mt-1">
            수유 기록 때 기본값이 돼요
          </Text>
          {errors.feedingType ? (
            <Text className="font-body text-xs text-accent-sienna mt-1">
              {errors.feedingType.message}
            </Text>
          ) : null}
        </View>

        {/* Weight (optional) */}
        <View className="mb-8">
          <Text className="font-body text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1">
            출생 체중 (선택)
          </Text>
          <Controller
            control={control}
            name="weightKg"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="3.50"
                  placeholderTextColor="#8A7A63"
                  editable={!isDisabled}
                  keyboardType="decimal-pad"
                  className="font-body text-base text-ink-primary dark:text-ink-primary-dark bg-bg-surface dark:bg-bg-surface-dark border border-border-subtle dark:border-border-subtle-dark rounded-md px-3 py-3 pr-12"
                />
                <Text className="font-body text-base text-ink-tertiary dark:text-ink-tertiary-dark absolute right-3 top-3">
                  kg
                </Text>
              </View>
            )}
          />
          <Text className="font-body text-xs text-ink-tertiary dark:text-ink-tertiary-dark mt-1">
            건너뛰어도 괜찮아요
          </Text>
          {errors.weightKg ? (
            <Text className="font-body text-xs text-accent-sienna mt-1">
              {errors.weightKg.message}
            </Text>
          ) : null}
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isDisabled}
          activeOpacity={0.8}
          className={`rounded-md py-4 items-center bg-ink-primary dark:bg-ink-primary-dark mb-8 ${
            isDisabled ? 'opacity-50' : ''
          }`}
        >
          <Text className="font-body text-base font-semibold text-ink-on-accent dark:text-bg-page-dark">
            {isDisabled ? '저장 중…' : '시작하기'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
