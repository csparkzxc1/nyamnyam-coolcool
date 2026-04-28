import { useEffect, useMemo, useState } from 'react';

import { Alert, ScrollView, View } from 'react-native';

import { differenceInMinutes } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyProfileHeader } from '@/components/home/BabyProfileHeader';
import { NextActionCard, type NextActionScenario } from '@/components/home/NextActionCard';
import type { QuickLogKind } from '@/components/home/QuickLogButton';
import { QuickLogGrid } from '@/components/home/QuickLogGrid';
import { Timeline } from '@/components/home/Timeline';
import { TipCard } from '@/components/home/TipCard';
import { pickDailyTip } from '@/data/tipMessages';
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

// Mock baby (used as fallback when session has no baby attached yet — should
// not normally happen because app/index.tsx redirects to onboarding first).
const FALLBACK_BABY = {
  name: '아기',
  birthDate: new Date(),
};

// Today's mock events — replaces real DB data until T501.
function buildMockEvents(referenceDay: Date): TimelineEvent[] {
  const at = (h: number, m: number) => {
    const d = new Date(referenceDay);
    d.setHours(h, m, 0, 0);
    return d;
  };
  return [
    { id: '1', kind: 'feed', startedAt: at(6, 0) },
    { id: '2', kind: 'diaper', startedAt: at(7, 30) },
    { id: '3', kind: 'sleep', startedAt: at(8, 0), endedAt: at(10, 0) },
    { id: '4', kind: 'feed', startedAt: at(10, 30) },
    { id: '5', kind: 'diaper', startedAt: at(12, 0) },
    { id: '6', kind: 'sleep', startedAt: at(13, 0), endedAt: at(15, 0) },
    { id: '7', kind: 'feed', startedAt: at(15, 30) },
    { id: '8', kind: 'bath', startedAt: at(17, 0) },
    { id: '9', kind: 'diaper', startedAt: at(18, 0) },
    { id: '10', kind: 'feed', startedAt: at(19, 0) },
  ];
}

interface NextActionView {
  scenario: NextActionScenario;
  label: string;
  primary: string;
  primaryEm?: string;
  secondary?: string;
}

/**
 * Derives the NextActionCard view from today's events. This is a placeholder
 * for the prediction engine that lands in T401 — for now it just maps
 * "minutes since last feed" to a scenario with hardcoded thresholds.
 */
function deriveNextAction(events: readonly TimelineEvent[], now: Date): NextActionView {
  // Active sleep wins over everything else
  const activeSleep = events.find((e) => e.kind === 'sleep' && !e.endedAt);
  if (activeSleep) {
    const minutesSleeping = differenceInMinutes(now, activeSleep.startedAt);
    const hours = Math.floor(minutesSleeping / 60);
    const mins = minutesSleeping % 60;
    return {
      scenario: 'sleeping',
      label: '자고 있어요',
      primary: hours > 0 ? `${hours}시간 ${mins}분째` : `${mins}분째`,
      primaryEm: '자고 있는 중',
      secondary: '평균 낮잠은 1~2시간 · 편안한 속도예요',
    };
  }

  const feeds = events.filter((e) => e.kind === 'feed');
  const lastFeed = feeds[feeds.length - 1];

  if (!lastFeed) {
    return {
      scenario: 'normal',
      label: '오늘 첫 수유',
      primary: '준비됐어요',
      secondary: '첫 수유를 기록해주세요',
    };
  }

  const minutesSince = differenceInMinutes(now, lastFeed.startedAt);
  const lastFeedAgo = formatTimeAgo(lastFeed.startedAt, now);

  if (minutesSince < 120) {
    const minutesUntilNext = 180 - minutesSince;
    return {
      scenario: 'normal',
      label: '다음 수유 예상',
      primary: lastFeedAgo,
      primaryEm: `(약 ${minutesUntilNext}분 후 다음 수유)`,
      secondary: `마지막 수유 ${lastFeedAgo}`,
    };
  }

  if (minutesSince < 180) {
    return {
      scenario: 'warning',
      label: '곧 다음 수유',
      primary: `${Math.floor(minutesSince / 60)}시간 ${minutesSince % 60}분 전`,
      primaryEm: '(예상 시각 도달)',
      secondary: `마지막 수유 ${lastFeedAgo}`,
    };
  }

  return {
    scenario: 'alert',
    label: `마지막 수유 후 ${Math.floor(minutesSince / 60)}시간`,
    primary: '지금',
    primaryEm: '(슬슬 챙겨주세요)',
    secondary: '신생아는 보통 3시간마다 수유해요',
  };
}

/**
 * Computes per-kind "last at" text for the QuickLogGrid.
 */
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
  // Note: app/index.tsx already gates unauthenticated users out, so the
  // session is guaranteed to exist by the time this screen renders. We don't
  // need to read it directly here — baby/event data hooks (T501) will pull
  // user context from the session store as needed.

  // For now, baby info is hardcoded — wiring it through useQuery for the
  // actual logged-in baby is part of T501. Using a deterministic fallback
  // keeps the home stable until then.
  const baby = FALLBACK_BABY;

  // Live "now" tick every minute so time-ago text and scenario thresholds
  // refresh without a full reload.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Active timer for the QuickLogGrid (visual only — Supabase write-through
  // is T501 territory).
  const [activeKind, setActiveKind] = useState<QuickLogKind | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  useEffect(() => {
    if (activeKind === null) return;
    const id = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [activeKind]);

  const events = useMemo(() => buildMockEvents(now), [now]);
  const nextAction = useMemo(() => deriveNextAction(events, now), [events, now]);
  const lastAt = useMemo(() => deriveLastAt(events, now), [events, now]);
  const dailyTip = useMemo(() => pickDailyTip(now), [now]);

  const handleQuickPress = (kind: QuickLogKind) => {
    if (activeKind === kind) {
      setActiveKind(null);
      setSecondsElapsed(0);
    } else {
      setActiveKind(kind);
      setSecondsElapsed(0);
    }
  };

  // Caregiver count is mocked to 1 (solo) until family sharing lands in a
  // later sprint — header will hide its badge automatically at < 2.
  const caregiverCount = 1;

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <BabyProfileHeader
          name={baby.name}
          birthDate={baby.birthDate}
          caregiverCount={caregiverCount}
          onPress={SHOW_PROFILE_EDIT}
          now={now}
        />

        {/* Hero: next action prediction */}
        <NextActionCard
          scenario={nextAction.scenario}
          label={nextAction.label}
          primary={nextAction.primary}
          primaryEm={nextAction.primaryEm}
          secondary={nextAction.secondary}
          confidence="learning"
          onLongPress={SHOW_REASONING_MODAL}
        />

        {/* Quick log grid */}
        <QuickLogGrid
          activeKind={activeKind}
          activeTimer={formatTimer(secondsElapsed)}
          lastAt={lastAt}
          onPress={handleQuickPress}
        />

        {/* Today timeline */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <Timeline events={events} now={now} onEventPress={SHOW_EVENT_DETAIL} />
        </View>

        {/* Tip / encouragement */}
        <TipCard label={dailyTip.label} message={dailyTip.message} />
      </ScrollView>
    </SafeAreaView>
  );
}
