import { ScrollView, Text, View, Alert } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { NextActionCard } from '@/components/home/NextActionCard';

const SHOW_REASONING_MODAL = () =>
  Alert.alert('명세 모달', '"왜 이렇게 예측했나요?" 모달 - 추후 구현 예정');

export default function CardsDevScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-2">
          <Text className="font-display text-2xl text-ink-primary">NextActionCard · dev</Text>
          <Text className="mt-1 text-sm text-ink-secondary">
            T301 시각 검증 · 5 시나리오 (4 상태 + learning)
          </Text>
        </View>

        {/* normal */}
        <NextActionCard
          scenario="normal"
          confidence="high"
          label="다음 수유 예상"
          primary="오후 3:36"
          primaryEm="(약 31분 후)"
          secondary="마지막 수유 2시간 25분 전 · 120ml"
          onLongPress={SHOW_REASONING_MODAL}
        />

        {/* normal · learning (첫 7일 시나리오) */}
        <NextActionCard
          scenario="normal"
          confidence="learning"
          label="다음 수유 예상"
          primary="오후 3:36"
          primaryEm="(약 30분 후)"
          secondary="마지막 수유 2시간 25분 전 · 120ml"
          onLongPress={SHOW_REASONING_MODAL}
        />

        {/* warning */}
        <NextActionCard
          scenario="warning"
          confidence="medium"
          label="곧 다음 수유"
          primary="오후 3:50"
          primaryEm="(예상 시각 도달)"
          secondary="마지막 수유 3시간 40분 전 · 90ml"
          onLongPress={SHOW_REASONING_MODAL}
        />

        {/* alert */}
        <NextActionCard
          scenario="alert"
          confidence="high"
          label="마지막 수유 후 4시간"
          primary="지금"
          primaryEm="(슬슬 챙겨주세요)"
          secondary="신생아는 보통 3시간마다 수유해요"
          onLongPress={SHOW_REASONING_MODAL}
        />

        {/* sleeping */}
        <NextActionCard
          scenario="sleeping"
          confidence="high"
          label="자고 있어요"
          primary="1시간 20분째"
          primaryEm="자고 있는 중"
          secondary="평균 낮잠은 1~2시간 · 편안한 속도예요"
          onLongPress={SHOW_REASONING_MODAL}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
