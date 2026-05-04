import { useMemo, useState } from 'react';

import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Check, Syringe } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCurrentBaby } from '@/features/babies/hooks';
import {
  computeAllDoseStatuses,
  nextDose,
  vaccineProgress,
  type VaccineDoseWithStatus,
  type VaccineStatus,
} from '@/features/vaccines/vaccineSchedule';
import { useVaccineStore } from '@/stores/vaccineStore';

// ============================================================
// Helpers
// ============================================================

function formatStatusLabel(status: VaccineStatus): string {
  switch (status.kind) {
    case 'completed':
      return '완료';
    case 'overdue':
      return `${status.daysOverdue}일 지남`;
    case 'due':
      return '접종 시기';
    case 'upcoming':
      return `D-${status.daysUntil}`;
  }
}

function statusColor(status: VaccineStatus): string {
  switch (status.kind) {
    case 'completed':
      return '#8A7A63'; // muted
    case 'overdue':
      return '#B85428'; // sienna (urgent)
    case 'due':
      return '#3F2E1E'; // dark brown (action needed)
    case 'upcoming':
      return '#5C4A37'; // medium brown
  }
}

function formatRecommendedDate(d: Date): string {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

// ============================================================
// Sub-components
// ============================================================

interface NextDoseCardProps {
  next: VaccineDoseWithStatus | null;
  onMarkDone?: (doseId: string) => void;
}

function NextDoseCard({ next, onMarkDone }: NextDoseCardProps) {
  if (!next) {
    return (
      <View
        style={{
          backgroundColor: '#F4EBDC',
          borderRadius: 16,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <Text className="font-display text-[15px] text-fg-primary">모든 접종 완료 🎉</Text>
        <Text className="font-body text-[12px] text-fg-secondary" style={{ marginTop: 4 }}>
          현재까지 권장되는 모든 접종을 마쳤어요.
        </Text>
      </View>
    );
  }

  const { dose, status, recommendedDate } = next;
  const isUrgent = status.kind === 'overdue' || status.kind === 'due';

  return (
    <View
      style={{
        backgroundColor: isUrgent ? '#3F2E1E' : '#F4EBDC',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text
          className="font-display text-[12px] tracking-wider"
          style={{ color: isUrgent ? 'rgba(255,255,255,0.7)' : '#8A7A63' }}
        >
          다음 접종
        </Text>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: isUrgent ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
            borderRadius: 10,
          }}
        >
          <Text
            className="font-display text-[11px]"
            style={{ color: isUrgent ? '#FFFFFF' : statusColor(status) }}
          >
            {formatStatusLabel(status)}
          </Text>
        </View>
      </View>

      <Text
        className="font-display text-[20px]"
        style={{ color: isUrgent ? '#FFFFFF' : '#3F2E1E', marginBottom: 4 }}
      >
        {dose.name}
      </Text>
      {dose.totalDoses > 1 && (
        <Text
          className="font-body text-[12px]"
          style={{ color: isUrgent ? 'rgba(255,255,255,0.7)' : '#5C4A37' }}
        >
          {dose.doseNumber}차 / 총 {dose.totalDoses}차
        </Text>
      )}
      <Text
        className="font-body text-[13px]"
        style={{ color: isUrgent ? 'rgba(255,255,255,0.85)' : '#5C4A37', marginTop: 8 }}
      >
        권장일: {formatRecommendedDate(recommendedDate)}
      </Text>
      <Text
        className="font-body text-[12px]"
        style={{ color: isUrgent ? 'rgba(255,255,255,0.7)' : '#8A7A63', marginTop: 2 }}
      >
        {dose.description}
      </Text>

      {onMarkDone && (
        <Pressable
          onPress={() => onMarkDone(dose.id)}
          style={({ pressed }) => ({
            marginTop: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: isUrgent ? '#FFFFFF' : '#3F2E1E',
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            className="font-display text-[13px]"
            style={{ color: isUrgent ? '#3F2E1E' : '#FFFFFF' }}
          >
            완료로 표시
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface ProgressBarProps {
  done: number;
  total: number;
}

function ProgressBar({ done, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text className="font-display text-[13px] text-fg-primary">진행 상황</Text>
        <Text className="font-mono text-[13px] text-fg-secondary">
          {done} / {total}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: '#F4EBDC',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: '#B85428',
          }}
        />
      </View>
    </View>
  );
}

interface DoseRowProps {
  item: VaccineDoseWithStatus;
  onToggle: (doseId: string, completed: boolean) => void;
}

function DoseRow({ item, onToggle }: DoseRowProps) {
  const { dose, status, recommendedDate } = item;
  const isCompleted = status.kind === 'completed';

  return (
    <Pressable
      onPress={() => onToggle(dose.id, isCompleted)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 12,
        gap: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* Checkbox */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: isCompleted ? '#B85428' : '#C7B9A2',
          backgroundColor: isCompleted ? '#B85428' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isCompleted && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
      </View>

      {/* Body */}
      <View style={{ flex: 1 }}>
        <Text
          className="font-display text-[14px]"
          style={{
            color: isCompleted ? '#8A7A63' : '#3F2E1E',
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}
        >
          {dose.name}
        </Text>
        <Text className="font-body text-[11px] text-fg-secondary" style={{ marginTop: 2 }}>
          권장: {formatRecommendedDate(recommendedDate)}
          {dose.totalDoses > 1 ? ` · ${dose.doseNumber}/${dose.totalDoses}` : ''}
        </Text>
      </View>

      {/* Status badge */}
      <Text className="font-display text-[11px]" style={{ color: statusColor(status) }}>
        {formatStatusLabel(status)}
      </Text>
    </Pressable>
  );
}

// ============================================================
// Screen
// ============================================================

type FilterTab = 'upcoming' | 'completed';

export default function ScheduleScreen() {
  const babyQuery = useCurrentBaby();
  const baby = babyQuery.data ?? null;
  const completions = useVaccineStore((s) => (baby ? s.getCompletionsForBaby(baby.id) : {}));
  const markCompleted = useVaccineStore((s) => s.markCompleted);
  const unmarkCompleted = useVaccineStore((s) => s.unmarkCompleted);

  const [filter, setFilter] = useState<FilterTab>('upcoming');

  const now = new Date();
  const birthDate = baby?.birth_date ? new Date(baby.birth_date) : null;

  const allStatuses = useMemo(() => {
    if (!birthDate) return [];
    return computeAllDoseStatuses(birthDate, now, completions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate?.getTime(), completions, now.toDateString()]);

  const next = useMemo(() => {
    if (!birthDate) return null;
    return nextDose(birthDate, now, completions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDate?.getTime(), completions, now.toDateString()]);

  const progress = useMemo(() => vaccineProgress(completions), [completions]);

  // Sort statuses for display: overdue, due, upcoming, completed.
  const filtered = useMemo(() => {
    const order: Record<VaccineStatus['kind'], number> = {
      overdue: 0,
      due: 1,
      upcoming: 2,
      completed: 3,
    };
    const sorted = [...allStatuses].sort((a, b) => {
      const ka = order[a.status.kind];
      const kb = order[b.status.kind];
      if (ka !== kb) return ka - kb;
      return a.recommendedDate.getTime() - b.recommendedDate.getTime();
    });
    if (filter === 'completed') {
      return sorted.filter((s) => s.status.kind === 'completed');
    }
    return sorted.filter((s) => s.status.kind !== 'completed');
  }, [allStatuses, filter]);

  const handleToggle = (doseId: string, isCompleted: boolean) => {
    if (!baby) return;
    if (isCompleted) {
      Alert.alert('완료 취소', '이 접종을 완료 취소할까요?', [
        { text: '아니요', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => unmarkCompleted(baby.id, doseId),
        },
      ]);
    } else {
      markCompleted(baby.id, doseId, new Date());
    }
  };

  // ----- early returns -----
  if (babyQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (babyQuery.isError || !baby || !birthDate) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page px-6">
        <Text className="font-body text-sm text-accent-sienna text-center">
          아기 정보를 불러오지 못했어요.{'\n'}생일 정보가 등록되어 있는지 확인해주세요.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Syringe size={20} color="#3F2E1E" strokeWidth={1.8} />
          <Text className="font-display text-[20px] text-fg-primary">예방접종 일정</Text>
        </View>

        {/* Next dose */}
        <NextDoseCard
          next={next}
          onMarkDone={(doseId) => markCompleted(baby.id, doseId, new Date())}
        />

        {/* Progress */}
        <ProgressBar done={progress.completedCount} total={progress.totalCount} />

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {(['upcoming', 'completed'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: isActive ? '#3F2E1E' : '#FFFFFF',
                  alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  className="font-display text-[13px]"
                  style={{ color: isActive ? '#FFFFFF' : '#5C4A37' }}
                >
                  {tab === 'upcoming' ? '예정/지난' : '완료'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List */}
        <View style={{ gap: 8 }}>
          {filtered.length === 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Text className="font-body text-[13px] text-fg-secondary">
                {filter === 'completed' ? '완료한 접종이 없어요.' : '남은 접종이 없어요.'}
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <DoseRow key={item.dose.id} item={item} onToggle={handleToggle} />
            ))
          )}
        </View>

        {/* Footer note */}
        <Text
          className="font-body text-[11px] text-fg-secondary"
          style={{ marginTop: 8, textAlign: 'center', lineHeight: 16 }}
        >
          한국 질병관리청 표준 예방접종 일정 기준입니다.{'\n'}
          정확한 일정은 담당 의사와 상담해주세요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
