import { useEffect, useMemo, useState } from 'react';

import { ActivityIndicator, ScrollView, Text, View , Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';


import { GrowthChart } from '@/components/growth/GrowthChart';
import { GrowthEntryForm } from '@/components/growth/GrowthEntryForm';
import { AgeBandHeader } from '@/components/guide/AgeBandHeader';
import { FAQSection } from '@/components/guide/FAQSection';
import {
  PersonalComparisonCard,
  type ComparisonRow,
} from '@/components/guide/PersonalComparisonCard';
import { SleepCueGuide } from '@/components/guide/SleepCueGuide';
import { StandardsTable } from '@/components/guide/StandardsTable';
import { useCurrentBaby } from '@/features/babies/hooks';
import {
  useCreateGrowthRecord,
  useGrowthRecords,
} from '@/features/growth/hooks';
import type { Sex } from '@/features/growth/whoStandards';
import {
  bucketFor,
  summarizePersonal,
} from '@/features/guide/personalSummary';
import {
  FEED_STANDARDS,
  type FeedStandard,
  findStandardsForBirthDate,
  SLEEP_STANDARDS,
  type SleepStandard,
} from '@/features/guide/standards';
import { useEvents } from '@/features/logging/hooks';

const LOOKBACK_DAYS = 7;
const MIN_FEED_SAMPLES = 4; // matches `confidenceFromCount` in prediction.ts
const MIN_SLEEP_SAMPLES = 3;

const formatMinutesAsHm = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
};

const formatHours = (hours: number): string => `${hours}시간`;

export default function GuideScreen() {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    // Hourly tick is enough — the band only changes at month boundaries.
    const id = setInterval(() => setNow(new Date()), 60 * 60_000);
    return () => clearInterval(id);
  }, []);

  const babyQuery = useCurrentBaby();
  const babyIdOrNull = babyQuery.data?.id ?? null;
  const eventsQuery = useEvents(babyIdOrNull, LOOKBACK_DAYS);
  const growthQuery = useGrowthRecords(babyIdOrNull);
  const createGrowth = useCreateGrowthRecord(babyIdOrNull);

  const standards = useMemo(() => {
    if (!babyQuery.data) return null;
    return findStandardsForBirthDate(new Date(babyQuery.data.birth_date), now);
  }, [babyQuery.data, now]);

  const personal = useMemo(() => {
    if (!eventsQuery.data) return null;
    return summarizePersonal(eventsQuery.data, LOOKBACK_DAYS, now);
  }, [eventsQuery.data, now]);

  const measurements = useMemo(() => {
    if (!growthQuery.data) return [];
    return growthQuery.data.map((row) => ({
      measuredAt: new Date(row.measured_at),
      weightKg: row.weight_kg,
    }));
  }, [growthQuery.data]);

  if (babyQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (babyQuery.isError || !babyQuery.data || !standards) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page px-6">
        <Text className="font-body text-sm text-accent-sienna text-center">
          아기 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </Text>
      </SafeAreaView>
    );
  }

  const baby = babyQuery.data;
  const { sleep: currentSleep, feed: currentFeed } = standards;
  const babySex: Sex | null =
    baby.gender === 'M' || baby.gender === 'F' ? (baby.gender as Sex) : null;

  const handleGrowthSubmit = (values: {
    weightKg: number | null;
    heightCm: number | null;
    measuredAt: Date;
  }) => {
    createGrowth.mutate(
      {
        baby_id: baby.id,
        created_by: baby.created_by,
        measured_at: values.measuredAt.toISOString(),
        weight_kg: values.weightKg,
        height_cm: values.heightCm,
      },
      {
        onError: () => Alert.alert('저장 실패', '잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  const comparisonRows: ComparisonRow[] = personal
    ? [
        {
          label: '평균 수유 간격',
          personal: personal.feedIntervalMinutes,
          formatPersonal: formatMinutesAsHm,
          standardRange: currentFeed.intervalMinutesRange,
          formatRange: (r) =>
            `${formatMinutesAsHm(r.min)}~${formatMinutesAsHm(r.max)}`,
          bucket:
            personal.feedIntervalMinutes !== null
              ? bucketFor(personal.feedIntervalMinutes, currentFeed.intervalMinutesRange)
              : null,
          sampleCount: personal.feedSampleCount,
          minSamples: MIN_FEED_SAMPLES,
        },
        {
          label: '하루 평균 수면 시간',
          personal: personal.dailySleepHours,
          formatPersonal: formatHours,
          standardRange: currentSleep.totalSleepHoursRange,
          formatRange: (r) => `${r.min}~${r.max}시간`,
          bucket:
            personal.dailySleepHours !== null
              ? bucketFor(personal.dailySleepHours, currentSleep.totalSleepHoursRange)
              : null,
          sampleCount: personal.sleepSampleCount,
          minSamples: MIN_SLEEP_SAMPLES,
        },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <AgeBandHeader
          babyName={baby.name}
          birthDate={new Date(baby.birth_date)}
          currentBandLabel={currentSleep.ageLabel}
          now={now}
        />

        {personal ? (
          <PersonalComparisonCard rows={comparisonRows} />
        ) : eventsQuery.isLoading ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <ActivityIndicator />
          </View>
        ) : null}

        <StandardsTable<SleepStandard>
          eyebrow="수면"
          title="월령별 수면 표준"
          columns={[
            { header: '월령', accessor: (r) => r.ageLabel, flex: 1.2 },
            { header: '1일 총 수면', accessor: (r) => r.totalSleepLabel, flex: 1.1 },
            { header: '낮잠', accessor: (r) => `${r.napCountLabel} · ${r.napDurationLabel}`, flex: 1.4 },
            { header: '한 번에', accessor: (r) => r.longestStretchLabel, flex: 1 },
          ]}
          rows={SLEEP_STANDARDS}
          isHighlighted={(r) => r.ageLabel === currentSleep.ageLabel}
        />

        <StandardsTable<FeedStandard>
          eyebrow="수유 · 식사"
          title="월령별 수유 표준"
          columns={[
            { header: '월령', accessor: (r) => r.ageLabel, flex: 1.2 },
            { header: '1회 분유량', accessor: (r) => r.perFeedLabel, flex: 1.1 },
            { header: '간격', accessor: (r) => r.intervalLabel, flex: 0.9 },
            { header: '이유식', accessor: (r) => r.solidLabel, flex: 1.3 },
          ]}
          rows={FEED_STANDARDS}
          isHighlighted={(r) => r.ageLabel === currentFeed.ageLabel}
        />

        <GrowthChart
          babyBirthDate={new Date(baby.birth_date)}
          babySex={babySex}
          measurements={measurements}
        />

        <GrowthEntryForm
          isSubmitting={createGrowth.isPending}
          onSubmit={handleGrowthSubmit}
        />

        <SleepCueGuide />

        <FAQSection />

        <View style={{ paddingHorizontal: 8, paddingTop: 4, gap: 6 }}>
          <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
            출처: 보건복지부 임신육아종합포털(아이사랑) · 미국소아과학회(AAP) · AASM 2016 합의성명서
          </Text>
          <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
            ※ 표준값은 일반적인 가이드입니다. 개별 아이에 따라 다를 수 있어요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
