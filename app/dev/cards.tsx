import { useEffect, useState } from 'react';

import { ScrollView, Text, View, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { NextActionCard } from '@/components/home/NextActionCard';
import type { QuickLogKind } from '@/components/home/QuickLogButton';
import { QuickLogGrid } from '@/components/home/QuickLogGrid';

const SHOW_REASONING_MODAL = () =>
  Alert.alert('명세 모달', '"왜 이렇게 예측했나요?" 모달 - 추후 구현 예정');

function formatTimer(secondsElapsed: number): string {
  const mm = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
  const ss = String(secondsElapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function CardsDevScreen() {
  // Demo grid state — independent from real loggingStore for now.
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

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="font-display text-2xl text-ink-primary">홈 컴포넌트 · dev</Text>
          <Text className="mt-1 text-sm text-ink-secondary">T301 카드 + T302 그리드 시각 검증</Text>
        </View>

        {/* === T301 NextActionCard 시나리오 === */}
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

        {/* === T302 QuickLogGrid (interactive) === */}
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
      </ScrollView>
    </SafeAreaView>
  );
}
