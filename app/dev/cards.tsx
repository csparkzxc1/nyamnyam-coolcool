import { useEffect, useState } from 'react';

import { ScrollView, Text, View, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyProfileHeader } from '@/components/home/BabyProfileHeader';
import { NextActionCard } from '@/components/home/NextActionCard';
import type { QuickLogKind } from '@/components/home/QuickLogButton';
import { QuickLogGrid } from '@/components/home/QuickLogGrid';
import { Timeline } from '@/components/home/Timeline';
import { TipCard } from '@/components/home/TipCard';
import { pickDailyTip } from '@/data/tipMessages';
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

const MOCK_BABY = {
  name: '윤서아',
  birthDate: new Date('2026-03-12T00:00:00'),
};

// Today's mock events — a realistic newborn day pattern.
function buildMockEvents(referenceDay: Date): TimelineEvent[] {
  const at = (h: number, m: number) => {
    const d = new Date(referenceDay);
    d.setHours(h, m, 0, 0);
    return d;
  };
  return [
    { id: '1', kind: 'feed', startedAt: at(6, 0) },
    { id: '2', kind: 'diaper', startedAt: at(7, 30) },
    {
      id: '3',
      kind: 'sleep',
      startedAt: at(8, 0),
      endedAt: at(10, 0),
    },
    { id: '4', kind: 'feed', startedAt: at(10, 30) },
    { id: '5', kind: 'diaper', startedAt: at(12, 0) },
    {
      id: '6',
      kind: 'sleep',
      startedAt: at(13, 0),
      endedAt: at(15, 0),
    },
    { id: '7', kind: 'feed', startedAt: at(15, 30) },
    { id: '8', kind: 'bath', startedAt: at(17, 0) },
    { id: '9', kind: 'diaper', startedAt: at(18, 0) },
    { id: '10', kind: 'feed', startedAt: at(19, 0) },
  ];
}

export default function CardsDevScreen() {
  const [activeKind, setActiveKind] = useState<QuickLogKind | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (activeKind === null) return;
    const id = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [activeKind]);

  const handlePress = (kind: QuickLogKind) => {
    if (activeKind === kind) {
      setActiveKind(null);
      setSecondsElapsed(0);
    } else {
      setActiveKind(kind);
      setSecondsElapsed(0);
    }
  };

  const dailyTip = pickDailyTip();
  const today = new Date();
  const mockEvents = buildMockEvents(today);

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="font-display text-2xl text-ink-primary">홈 컴포넌트 · dev</Text>
          <Text className="mt-1 text-sm text-ink-secondary">
            T301 + T302 + T303 + T304 + T305 시각 검증
          </Text>
        </View>

        {/* === T303 BabyProfileHeader === */}
        <View style={{ gap: 12 }}>
          <Text className="font-display text-base text-ink-secondary">BabyProfileHeader</Text>

          <BabyProfileHeader
            name={MOCK_BABY.name}
            birthDate={MOCK_BABY.birthDate}
            onPress={SHOW_PROFILE_EDIT}
          />

          <BabyProfileHeader
            name={MOCK_BABY.name}
            birthDate={MOCK_BABY.birthDate}
            caregiverCount={2}
            onPress={SHOW_PROFILE_EDIT}
          />

          <BabyProfileHeader
            name="준"
            birthDate={new Date('2026-04-15T00:00:00')}
            caregiverCount={3}
            onPress={SHOW_PROFILE_EDIT}
          />
        </View>

        {/* === T301 NextActionCard === */}
        <View style={{ gap: 16 }}>
          <Text className="font-display text-base text-ink-secondary">NextActionCard</Text>

          <NextActionCard
            scenario="normal"
            confidence="high"
            label="다음 수유 예상"
            primary="오후 3:36"
            primaryEm="(약 31분 후)"
            secondary="마지막 수유 2시간 25분 전 · 120ml"
            onLongPress={SHOW_REASONING_MODAL}
          />

          <NextActionCard
            scenario="normal"
            confidence="learning"
            label="다음 수유 예상"
            primary="오후 3:36"
            primaryEm="(약 30분 후)"
            secondary="마지막 수유 2시간 25분 전 · 120ml"
            onLongPress={SHOW_REASONING_MODAL}
          />

          <NextActionCard
            scenario="warning"
            confidence="medium"
            label="곧 다음 수유"
            primary="오후 3:50"
            primaryEm="(예상 시각 도달)"
            secondary="마지막 수유 3시간 40분 전 · 90ml"
            onLongPress={SHOW_REASONING_MODAL}
          />

          <NextActionCard
            scenario="alert"
            confidence="high"
            label="마지막 수유 후 4시간"
            primary="지금"
            primaryEm="(슬슬 챙겨주세요)"
            secondary="신생아는 보통 3시간마다 수유해요"
            onLongPress={SHOW_REASONING_MODAL}
          />

          <NextActionCard
            scenario="sleeping"
            confidence="high"
            label="자고 있어요"
            primary="1시간 20분째"
            primaryEm="자고 있는 중"
            secondary="평균 낮잠은 1~2시간 · 편안한 속도예요"
            onLongPress={SHOW_REASONING_MODAL}
          />
        </View>

        {/* === T304 Timeline === */}
        <View style={{ gap: 12 }}>
          <Text className="font-display text-base text-ink-secondary">Timeline · 24h</Text>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Timeline events={mockEvents} now={today} onEventPress={SHOW_EVENT_DETAIL} />
          </View>
        </View>

        {/* === T302 QuickLogGrid === */}
        <View style={{ gap: 12 }}>
          <Text className="font-display text-base text-ink-secondary">
            QuickLogGrid · 탭해서 시작/종료
          </Text>

          <QuickLogGrid
            activeKind={activeKind}
            activeTimer={formatTimer(secondsElapsed)}
            lastAt={{
              feed: '2시간 25분 전',
              sleep: '1시간 15분 전',
              diaper: '45분 전',
              bath: '어제',
            }}
            subtitles={{
              feed: '120ml · 분유',
              sleep: '낮잠 · 50분',
              diaper: '오늘 4번',
              bath: '다음: 오늘 저녁',
            }}
            onPress={handlePress}
          />
        </View>

        {/* === T305 TipCard === */}
        <View style={{ gap: 12 }}>
          <Text className="font-display text-base text-ink-secondary">TipCard</Text>

          <TipCard label={dailyTip.label} message={dailyTip.message} />

          <TipCard
            label="이번 주 변화"
            message={`${MOCK_BABY.name}가 지난주보다 밤잠을 평균 30분 더 자고 있어요.\n덕분에 한숨 돌리네요.`}
          />

          <TipCard
            icon="☀️"
            label="오늘의 작은 팁"
            message="아기가 깨어 있을 때 배밀이 시간을 짧게라도\n가져보세요. 목 근육 발달에 도움이 됩니다."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
