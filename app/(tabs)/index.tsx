import { useEffect, useMemo, useState } from 'react';

import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { differenceInMinutes } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyProfileHeader } from '@/components/home/BabyProfileHeader';
import { NextActionCard, type NextActionScenario } from '@/components/home/NextActionCard';
import type { QuickLogKind } from '@/components/home/QuickLogButton';
import { QuickLogGrid } from '@/components/home/QuickLogGrid';
import { Timeline } from '@/components/home/Timeline';
import { TipCard } from '@/components/home/TipCard';
import { pickDailyTip } from '@/data/tipMessages';
import { useCurrentBaby } from '@/features/babies/hooks';
import { useEvents } from '@/features/logging/hooks';
import {
  predictNextFeed,
  type PredictionConfidence,
  type PredictionResult,
} from '@/lib/prediction';
import { formatTimeAgo } from '@/lib/timeAgo';
import type { TimelineEvent } from '@/lib/timelineEvents';

const SHOW_REASONING_MODAL = () =>
  Alert.alert('명세 모달', '"왜 이렇게 예측했나요?" 모달 - 추후 구현 예정');

const SHOW_PROFILE_EDIT = () => Alert.alert('프로필 편집', '아기 정보 편집 - 추후 구현 예정');

const SHOW_EVENT_DETAIL = (event: TimelineEvent) =>
  Alert.alert(
    '이벤트',
    `${event.kind} · ${event.startedAt.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
  );

function formatTimer(secondsElapsed: number): string {
  const mm = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const ss = String(secondsElapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

interface NextActionView {
  scenario: NextActionScenario;
  label: string;
  primary: string;
  primaryEm?: string;
  secondary?: string;
  confidence: PredictionConfidence;
}

/**
 * Shapes the prediction result into the NextActionCard's view-level props.
 *
 * The prediction itself lives in src/lib/prediction.ts — this function only
 * formats the numbers into Korean text and chooses the human-readable label
 * for each scenario.
 */
function viewFromPrediction(
  prediction: PredictionResult,
  events: readonly TimelineEvent[],
  now: Date,
): NextActionView {
  if (prediction.scenario === 'sleeping' && prediction.activeSleepStartedAt) {
    const minutesSleeping = differenceInMinutes(now, prediction.activeSleepStartedAt);
    const hours = Math.floor(minutesSleeping / 60);
    const mins = minutesSleeping % 60;
    return {
      scenario: 'sleeping',
      label: '자고 있어요',
      primary: hours > 0 ? `${hours}시간 ${mins}분째` : `${mins}분째`,
      primaryEm: '자고 있는 중',
      secondary: '평균 낮잠은 1~2시간 · 편안하게 두세요',
      confidence: prediction.confidence,
    };
  }

  if (prediction.lastFeedAt === null) {
    return {
      scenario: 'normal',
      label: '오늘 첫 수유',
      primary: '준비됐어요',
      secondary: '첫 수유를 기록해주세요',
      confidence: prediction.confidence,
    };
  }

  const lastFeedAgo = formatTimeAgo(prediction.lastFeedAt, now);
  const nextAt = prediction.nextAt;

  if (prediction.scenario === 'normal' && nextAt) {
    const minutesUntilNext = differenceInMinutes(nextAt, now);
    return {
      scenario: 'normal',
      label: '다음 수유 예상',
      primary: lastFeedAgo,
      primaryEm: `(약 ${minutesUntilNext}분 후 다음 수유)`,
      secondary: `마지막 수유 ${lastFeedAgo}`,
      confidence: prediction.confidence,
    };
  }

  if (prediction.scenario === 'warning') {
    return {
      scenario: 'warning',
      label: '곧 다음 수유',
      primary: lastFeedAgo,
      primaryEm: '(예상 시각 임박)',
      secondary: `마지막 수유 ${lastFeedAgo}`,
      confidence: prediction.confidence,
    };
  }

  // alert
  const minutesSinceLast = differenceInMinutes(now, prediction.lastFeedAt);
  const hoursSince = Math.floor(minutesSinceLast / 60);
  return {
    scenario: 'alert',
    label: `마지막 수유 후 ${hoursSince}시간`,
    primary: '지금',
    primaryEm: '(슬슬 챙겨주세요)',
    secondary: '신생아는 보통 3시간마다 수유해요',
    confidence: prediction.confidence,
  };
}

function deriveLastAt(
  events: readonly TimelineEvent[],
  now: Date,
): Partial<Record<QuickLogKind, string>> {
  const result: Partial<Record<QuickLogKind, string>> = {};
  for (const kind of ['feed', 'sleep', 'diaper', 'bath'] as const) {
    const lastOfKind = [...events].reverse().find((e) => e.kind === kind);
    if (lastOfKind) {
      result[kind] = formatTimeAgo(lastOfKind.startedAt, now);
    }
  }
  return result;
}

export default function HomeScreen() {
  // ============================================================
  // Hooks (must run on every render in stable order — no early
  // returns above this section, ever)
  // ============================================================
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const [activeKind, setActiveKind] = useState<QuickLogKind | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  useEffect(() => {
    if (activeKind === null) return;
    const id = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [activeKind]);

  // T501: real data hooks (replaces FALLBACK_BABY + buildMockEvents)
  const babyQuery = useCurrentBaby();
  const eventsQuery = useEvents(babyQuery.data?.id ?? null);

  const events = useMemo<readonly TimelineEvent[]>(
    () => eventsQuery.data ?? [],
    [eventsQuery.data],
  );

  const prediction = useMemo<PredictionResult>(
    () =>
      predictNextFeed({
        events,
        // While baby is loading, predictNextFeed runs with a placeholder date.
        // Result is unused because we early-return below before render.
        babyBirthDate: babyQuery.data ? new Date(babyQuery.data.birth_date) : new Date(),
        now,
      }),
    [events, babyQuery.data, now],
  );

  const nextAction = useMemo(
    () => viewFromPrediction(prediction, events, now),
    [prediction, events, now],
  );

  const lastAt = useMemo(() => deriveLastAt(events, now), [events, now]);
  const dailyTip = useMemo(() => pickDailyTip(now), [now]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleQuickPress = (kind: QuickLogKind) => {
    if (activeKind === kind) {
      setActiveKind(null);
      setSecondsElapsed(0);
    } else {
      setActiveKind(kind);
      setSecondsElapsed(0);
    }
  };

  // ============================================================
  // Early returns (after all hooks)
  // ============================================================
  // app/index.tsx already redirects unauthenticated/no-baby users away,
  // so this loading state is brief — only first render before the baby
  // query resolves from cache.
  if (babyQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (babyQuery.isError || !babyQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page px-6">
        <Text className="font-body text-sm text-accent-sienna text-center">
          아기 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </Text>
      </SafeAreaView>
    );
  }

  const baby = babyQuery.data;

  // TODO(T601): real caregiver count via useCaregivers(baby.id) when family
  // sharing is wired up. For now, single-parent default.
  const caregiverCount = 1;

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BabyProfileHeader
          name={baby.name}
          birthDate={new Date(baby.birth_date)}
          caregiverCount={caregiverCount}
          onPress={SHOW_PROFILE_EDIT}
          now={now}
        />

        <NextActionCard
          scenario={nextAction.scenario}
          label={nextAction.label}
          primary={nextAction.primary}
          primaryEm={nextAction.primaryEm}
          secondary={nextAction.secondary}
          confidence={nextAction.confidence}
          onLongPress={SHOW_REASONING_MODAL}
        />

        <QuickLogGrid
          activeKind={activeKind}
          activeTimer={formatTimer(secondsElapsed)}
          lastAt={lastAt}
          onPress={handleQuickPress}
        />

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Timeline events={events} now={now} onEventPress={SHOW_EVENT_DETAIL} />
        </View>

        <TipCard label={dailyTip.label} message={dailyTip.message} />
      </ScrollView>
    </SafeAreaView>
  );
}
