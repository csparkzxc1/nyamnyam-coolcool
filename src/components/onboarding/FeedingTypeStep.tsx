import { Pressable, ScrollView, Text, View } from 'react-native';

import type { FeedingType } from '@/features/babies/api';
import { type LastFeedChoice, useOnboardingStore } from '@/stores/onboardingStore';

export interface FeedingTypeStepProps {
  onBack: () => void;
  onNext: () => void;
}

const FEEDING_OPTIONS: readonly { value: FeedingType; label: string; emoji: string; hint: string }[] = [
  { value: 'breast', label: '모유', emoji: '🤱', hint: '직접 수유 위주' },
  { value: 'formula', label: '분유', emoji: '🍼', hint: '분유만 사용' },
  { value: 'mixed', label: '혼합', emoji: '🔀', hint: '모유 + 분유' },
];

const LAST_FEED_CHOICES: readonly { value: LastFeedChoice; label: string }[] = [
  { value: 'just-now', label: '방금' },
  { value: '30m-ago', label: '30분 전' },
  { value: '1h-ago', label: '1시간 전' },
  { value: 'unknown', label: '모름' },
];

/**
 * Step 3 — feeding method (DB column) + last-feed quick pick.
 *
 * The "last feed" answer becomes a synthetic feeding_record on
 * baby creation so the home screen prediction has an anchor point
 * from minute 0. "Unknown" leaves the timeline empty (no record).
 */
export function FeedingTypeStep({ onBack, onNext }: FeedingTypeStepProps) {
  const { feedingType, lastFeedChoice, setFeedingType, setLastFeedChoice } = useOnboardingStore();

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 22, paddingBottom: 32, flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text
          className="font-display text-[24px] font-medium"
          style={{ color: '#2A1D12' }}
        >
          어떻게 먹이고 있나요?
        </Text>
        <Text className="mt-[6px] font-body text-[13px]" style={{ color: '#8A7A63' }}>
          수유 방식을 알려주시면 기록 화면이 더 편해져요.
        </Text>
      </View>

      {/* Feeding method */}
      <View style={{ gap: 8 }}>
        {FEEDING_OPTIONS.map((opt) => {
          const active = feedingType === opt.value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
              onPress={() => setFeedingType(opt.value)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 14,
                gap: 14,
                backgroundColor: active ? '#B85428' : pressed ? '#FAF4EC' : '#FFFFFF',
              })}
            >
              <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  className="font-display text-[16px] font-medium"
                  style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                >
                  {opt.label}
                </Text>
                <Text
                  className="font-body text-[12px]"
                  style={{ color: active ? 'rgba(255, 248, 239, 0.85)' : '#8A7A63' }}
                >
                  {opt.hint}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Last-feed quick pick */}
      <View style={{ gap: 8 }}>
        <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
          마지막 수유는 언제였나요?
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LAST_FEED_CHOICES.map((c) => {
            const active = lastFeedChoice === c.value;
            return (
              <Pressable
                key={c.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={c.label}
                onPress={() => setLastFeedChoice(c.value)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: active ? '#B85428' : pressed ? '#EFE4D0' : '#FFFFFF',
                })}
              >
                <Text
                  className="font-body text-[13px] font-medium"
                  style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
          예측을 빨리 시작하려면 가장 가까운 시각을 골라주세요.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

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
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 14,
            backgroundColor: pressed ? '#9E4621' : '#B85428',
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
