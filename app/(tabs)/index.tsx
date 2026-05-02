import { useEffect, useMemo, useState } from 'react';

import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInMinutes, differenceInMonths } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnomalyBanner } from '@/components/home/AnomalyBanner';
import { BabyProfileHeader } from '@/components/home/BabyProfileHeader';
import { NextActionCard, type NextActionScenario } from '@/components/home/NextActionCard';
import { PredictionReasoningModal } from '@/components/home/PredictionReasoningModal';
import type { QuickLogKind } from '@/components/home/QuickLogButton';
import { QuickLogGrid } from '@/components/home/QuickLogGrid';
import { Timeline } from '@/components/home/Timeline';
import { TipCard } from '@/components/home/TipCard';
import { BabyEditModal } from '@/components/shared/BabyEditModal';
import { pickDailyTip } from '@/data/tipMessages';
import { detectAnomalies } from '@/features/anomalies/detect';
import { useCurrentBaby } from '@/features/babies/hooks';
import {
  createBathRecord,
  createDiaperRecord,
  createFeedingRecord,
  createSleepRecord,
  updateBaby,
  updateFeedingRecord,
  updateSleepRecord,
  type Baby,
  type BabyUpdate,
  type FeedingInsert,
} from '@/features/logging/api';
import { useDetailedEvents, useEventsByDate } from '@/features/logging/hooks';
import { summarizeEvents } from '@/features/logging/summarizeEvents';
import { useReminderSync } from '@/features/notifications/runtime';
import { useCaregivers } from '@/features/sharing/hooks';
import {
  predictNextFeed,
  type PredictionConfidence,
  type PredictionResult,
} from '@/lib/prediction';
import { formatTimeAgo } from '@/lib/timeAgo';
import type { TimelineEvent } from '@/lib/timelineEvents';
import {
  isDismissedWithin24h,
  useAnomaliesStore,
} from '@/stores/anomaliesStore';
import { useLoggingStore } from '@/stores/loggingStore';
import { useNotificationSettingsStore } from '@/stores/notificationSettingsStore';

const SHOW_EVENT_DETAIL = (event: TimelineEvent) =>
  Alert.alert(
    '이벤트',
    `${event.kind} · ${event.startedAt.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`,
  );

const FEED_FAILED = () => Alert.alert('기록 실패', '잠시 후 다시 시도해주세요');

/**
 * The 4 feeding_records.type values the home-screen quick log can emit.
 * `solid` is reserved for the dedicated meal-log flow (a future sprint).
 */
type FeedTypeChoice = 'breast_left' | 'breast_right' | 'formula';

function formatTimer(secondsElapsed: number): string {
  const mm = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const ss = String(secondsElapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Night sleeps roll over from late evening to early morning. Treating
 * 18:00–07:00 as 'night' avoids forcing the parent to choose for the
 * common case; a manual edit can override later.
 */
function deriveSleepType(now: Date): 'nap' | 'night' {
  const h = now.getHours();
  return h >= 18 || h < 7 ? 'night' : 'nap';
}

interface NextActionView {
  scenario: NextActionScenario;
  label: string;
  primary: string;
  primaryEm?: string;
  secondary?: string;
  confidence: PredictionConfidence;
}

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

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const babyQuery = useCurrentBaby();
  const today = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const eventsQuery = useEventsByDate(babyQuery.data?.id ?? null, today);
  // Anomaly detection needs >1 day of data (3-day sleep deficit, 24h
  // diaper count) and the per-kind detail fields (amountMl, diaper type,
  // sleep type), so it can't reuse the lightweight today query.
  const recentDetailedQuery = useDetailedEvents(babyQuery.data?.id ?? null, 7);
  const caregiversQuery = useCaregivers(babyQuery.data?.id ?? null);

  const detailedEvents = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const events = useMemo<readonly TimelineEvent[]>(
    () =>
      detailedEvents.map((e) => ({
        id: e.id,
        kind: e.kind,
        startedAt: e.startedAt,
        endedAt: 'endedAt' in e ? e.endedAt : undefined,
      })),
    [detailedEvents],
  );

  const activeTimer = useLoggingStore((s) => s.activeTimer);
  const startTimer = useLoggingStore((s) => s.startTimer);
  const attachRecordId = useLoggingStore((s) => s.attachRecordId);
  const stopTimer = useLoggingStore((s) => s.stopTimer);

  const activeKind = activeTimer?.kind ?? null;

  useEffect(() => {
    if (activeTimer === null) {
      setSecondsElapsed(0);
      return;
    }
    const tick = () =>
      setSecondsElapsed(Math.floor((Date.now() - activeTimer.startedAt.getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeTimer]);

  const queryClient = useQueryClient();
  const babyId = babyQuery.data?.id ?? null;
  const invalidateEvents = () => {
    if (babyId) {
      queryClient.invalidateQueries({ queryKey: ['events', babyId] });
    }
  };

  // ----- mutations: feed -----
  const feedStartMutation = useMutation({
    mutationFn: createFeedingRecord,
    onSuccess: (record) => {
      attachRecordId('feed', record.id);
      invalidateEvents();
    },
    onError: () => {
      stopTimer();
      FEED_FAILED();
    },
  });

  const feedStopMutation = useMutation({
    mutationFn: ({ recordId, endAt }: { recordId: string; endAt: Date }) =>
      updateFeedingRecord(recordId, { end_at: endAt.toISOString() }),
    onSuccess: invalidateEvents,
    onError: FEED_FAILED,
  });

  // ----- mutations: sleep -----
  const sleepStartMutation = useMutation({
    mutationFn: createSleepRecord,
    onSuccess: (record) => {
      attachRecordId('sleep', record.id);
      invalidateEvents();
    },
    onError: () => {
      stopTimer();
      FEED_FAILED();
    },
  });

  const sleepStopMutation = useMutation({
    mutationFn: ({ recordId, endAt }: { recordId: string; endAt: Date }) =>
      updateSleepRecord(recordId, { end_at: endAt.toISOString() }),
    onSuccess: invalidateEvents,
    onError: FEED_FAILED,
  });

  // ----- mutations: diaper, bath (point-in-time, no timer) -----
  const diaperMutation = useMutation({
    mutationFn: createDiaperRecord,
    onSuccess: invalidateEvents,
    onError: FEED_FAILED,
  });

  const bathMutation = useMutation({
    mutationFn: createBathRecord,
    onSuccess: invalidateEvents,
    onError: FEED_FAILED,
  });

  // ----- mutations: baby profile -----
  const updateBabyMutation = useMutation({
    mutationFn: ({ babyId: id, patch }: { babyId: string; patch: BabyUpdate }) =>
      updateBaby(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby'] });
      queryClient.invalidateQueries({ queryKey: ['babies'] });
      setEditOpen(false);
    },
    onError: () => Alert.alert('저장 실패', '잠시 후 다시 시도해 주세요.'),
  });

  const prediction = useMemo<PredictionResult>(
    () =>
      predictNextFeed({
        events,
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
  const dailySummary = useMemo(() => summarizeEvents(detailedEvents, now), [detailedEvents, now]);

  // ----- anomaly detection (T901) -----
  const dismissedAt = useAnomaliesStore((s) => s.dismissedAt);
  const dismissAnomaly = useAnomaliesStore((s) => s.dismiss);
  const anomalies = useMemo(() => {
    if (!babyQuery.data || !recentDetailedQuery.data) return [];
    return detectAnomalies({
      babyBirthDate: new Date(babyQuery.data.birth_date),
      events: recentDetailedQuery.data,
      now,
    });
  }, [babyQuery.data, recentDetailedQuery.data, now]);
  // Critical anomalies bypass the dismiss filter.
  const visibleAnomaly = useMemo(() => {
    return (
      anomalies.find((a) => {
        if (a.severity === 'critical') return true;
        return !isDismissedWithin24h(dismissedAt[a.code], now);
      }) ?? null
    );
  }, [anomalies, dismissedAt, now]);

  // ----- notification reminder sync (T602/T603) -----
  const notifSettings = useNotificationSettingsStore();
  const reminderInput = useMemo(() => {
    if (!babyQuery.data) return null;
    const ageMonths = differenceInMonths(now, new Date(babyQuery.data.birth_date));
    return {
      babyName: babyQuery.data.name,
      ageMonths,
      nextFeedAt: prediction.nextAt,
      lastFeedAt: prediction.lastFeedAt,
      // Sleep prediction is a future enhancement (next-sleep TBD); pass null
      // for now so the sleep reminder builder no-ops.
      nextSleepAt: null,
      anomalies,
      settings: {
        enabled: notifSettings.enabled,
        feedRemindersEnabled: notifSettings.feedRemindersEnabled,
        sleepRemindersEnabled: notifSettings.sleepRemindersEnabled,
        dnd: notifSettings.dnd,
      },
      now,
    };
  }, [babyQuery.data, prediction, anomalies, notifSettings, now]);
  useReminderSync(reminderInput);

  // ============================================================
  // Handlers
  // ============================================================

  /**
   * Start the feed timer with the chosen breast/formula type.
   * Runs the create mutation; activeTimer is set optimistically before
   * we know the DB record id (attachRecordId fills it in onSuccess).
   */
  const startFeedWithType = (baby: Baby, type: FeedTypeChoice) => {
    const startedAt = new Date();
    startTimer('feed');
    const insert: FeedingInsert = {
      baby_id: baby.id,
      created_by: baby.created_by,
      type,
      start_at: startedAt.toISOString(),
    };
    feedStartMutation.mutate(insert);
  };

  /**
   * Open the right type-picker for the baby's feeding_type.
   * - formula:    skip picker, just start (only one valid choice)
   * - breast:     2-button (왼쪽 / 오른쪽)
   * - mixed:      3-button (모유 좌 / 모유 우 / 분유)
   */
  const promptFeedTypeAndStart = (baby: Baby) => {
    if (baby.feeding_type === 'formula') {
      startFeedWithType(baby, 'formula');
      return;
    }

    if (baby.feeding_type === 'breast') {
      Alert.alert('수유 시작', '어느 쪽인가요?', [
        { text: '왼쪽 🤱', onPress: () => startFeedWithType(baby, 'breast_left') },
        { text: '오른쪽 🤱', onPress: () => startFeedWithType(baby, 'breast_right') },
        { text: '취소', style: 'cancel' },
      ]);
      return;
    }

    // mixed
    Alert.alert('수유 시작', '어떻게 먹였나요?', [
      { text: '모유 좌 🤱', onPress: () => startFeedWithType(baby, 'breast_left') },
      { text: '모유 우 🤱', onPress: () => startFeedWithType(baby, 'breast_right') },
      { text: '분유 🍼', onPress: () => startFeedWithType(baby, 'formula') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  /**
   * Handle a quick-log button tap. Branches by kind:
   *  - feed: start = type picker (depends on baby.feeding_type), stop = update
   *  - sleep: timer pattern (1st tap = start with auto nap/night, 2nd tap = stop)
   *  - diaper: 3-button alert (쉬/응가/둘 다) → insert
   *  - bath: instant insert
   */
  const handleQuickPress = (kind: QuickLogKind) => {
    if (!babyQuery.data) return;
    const baby: Baby = babyQuery.data;

    // ----- feed: timer kind with type picker on start -----
    if (kind === 'feed') {
      // Stop case: feed already in progress.
      if (activeTimer && activeTimer.kind === 'feed') {
        const { recordId } = activeTimer;
        if (recordId === null) {
          stopTimer();
          return;
        }
        feedStopMutation.mutate({ recordId, endAt: new Date() });
        stopTimer();
        return;
      }

      // Start case: pick type first (Alert), then create + start timer.
      promptFeedTypeAndStart(baby);
      return;
    }

    // ----- sleep: timer kind, no type picker (auto nap/night) -----
    if (kind === 'sleep') {
      if (activeTimer && activeTimer.kind === 'sleep') {
        const { recordId } = activeTimer;
        if (recordId === null) {
          stopTimer();
          return;
        }
        sleepStopMutation.mutate({ recordId, endAt: new Date() });
        stopTimer();
        return;
      }

      const startedAt = new Date();
      startTimer('sleep');
      sleepStartMutation.mutate({
        baby_id: baby.id,
        created_by: baby.created_by,
        type: deriveSleepType(startedAt),
        start_at: startedAt.toISOString(),
      });
      return;
    }

    // ----- diaper: choose type via Alert -----
    if (kind === 'diaper') {
      Alert.alert('기저귀 종류', '어떤 기저귀였나요?', [
        {
          text: '쉬 💧',
          onPress: () =>
            diaperMutation.mutate({
              baby_id: baby.id,
              created_by: baby.created_by,
              type: 'wet',
              at: new Date().toISOString(),
            }),
        },
        {
          text: '응가 💩',
          onPress: () =>
            diaperMutation.mutate({
              baby_id: baby.id,
              created_by: baby.created_by,
              type: 'dirty',
              at: new Date().toISOString(),
            }),
        },
        {
          text: '둘 다 🌊',
          onPress: () =>
            diaperMutation.mutate({
              baby_id: baby.id,
              created_by: baby.created_by,
              type: 'both',
              at: new Date().toISOString(),
            }),
        },
        { text: '취소', style: 'cancel' },
      ]);
      return;
    }

    // ----- bath: instant insert -----
    if (kind === 'bath') {
      bathMutation.mutate({
        baby_id: baby.id,
        created_by: baby.created_by,
        at: new Date().toISOString(),
      });
    }
  };

  // ============================================================
  // Early returns (after all hooks)
  // ============================================================
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
  const caregiverCount = caregiversQuery.data?.length ?? 1;

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
          onPress={() => setEditOpen(true)}
          now={now}
        />

        {visibleAnomaly ? (
          <AnomalyBanner
            anomaly={visibleAnomaly}
            onDismiss={() => dismissAnomaly(visibleAnomaly.code, now)}
          />
        ) : null}

        <NextActionCard
          scenario={nextAction.scenario}
          label={nextAction.label}
          primary={nextAction.primary}
          primaryEm={nextAction.primaryEm}
          secondary={nextAction.secondary}
          confidence={nextAction.confidence}
          onLongPress={() => setReasoningOpen(true)}
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
          <Timeline
            events={events}
            now={now}
            summary={dailySummary}
            onEventPress={SHOW_EVENT_DETAIL}
          />
        </View>

        <TipCard label={dailyTip.label} message={dailyTip.message} />
      </ScrollView>

      <PredictionReasoningModal
        visible={reasoningOpen}
        prediction={prediction}
        onClose={() => setReasoningOpen(false)}
      />

      <BabyEditModal
        baby={editOpen ? baby : null}
        isSubmitting={updateBabyMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSave={(patch) => updateBabyMutation.mutate({ babyId: baby.id, patch })}
      />
    </SafeAreaView>
  );
}
