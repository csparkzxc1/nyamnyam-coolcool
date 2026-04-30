import { useEffect, useState } from 'react';

import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { addDays, isSameDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecordTimelineList } from '@/components/record/RecordTimelineList';
import { useCurrentBaby } from '@/features/babies/hooks';
import type { DetailedEvent } from '@/features/logging/eventsTransform';
import { useEventsByDate } from '@/features/logging/hooks';

/**
 * "기록" tab — vertical detailed timeline for a single calendar day.
 *
 * Pairs with the home screen's compact gradient timeline: home answers
 * "what's happening now / next", this tab answers "what exactly happened
 * today (or any past day)". The two views share the same Supabase data
 * but use different abstractions (TimelineEvent vs DetailedEvent).
 *
 * Date navigation: ◀ / ▶ arrows step one day at a time; the next-day
 * arrow is disabled when on today (no future records exist yet).
 *
 * Tapping a row will open the edit modal (Phase 3, deferred). For now
 * the press is logged and ignored.
 */
export default function LogScreen() {
  // ============================================================
  // Hooks (stable order, no early returns above this section)
  // ============================================================
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // selectedDate is initialised once to "today at midnight" so that
  // navigating ↔ days produces stable comparisons (no time-of-day drift).
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const babyQuery = useCurrentBaby();
  const eventsQuery = useEventsByDate(babyQuery.data?.id ?? null, selectedDate);

  const isToday = isSameDay(selectedDate, now);
  const canGoForward = !isToday;

  const goPrev = () => setSelectedDate((d) => subDays(d, 1));
  const goNext = () => {
    if (canGoForward) setSelectedDate((d) => addDays(d, 1));
  };

  const handleItemPress = (event: DetailedEvent) => {
    // TODO(T701 Phase 3): open edit modal (시간 수정 / 삭제 / type 변경).
    // For now this is a no-op — the row tappability is wired so the
    // modal slot is ready, but the modal itself isn't built yet.
    // eslint-disable-next-line no-console
    console.log('row pressed:', event.kind, event.id);
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

  // ============================================================
  // Render
  // ============================================================
  const events = eventsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Date navigator */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
          }}
        >
          <Pressable
            onPress={goPrev}
            hitSlop={12}
            style={({ pressed }) => ({
              padding: 8,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <ChevronLeft size={22} color="#3F2E1E" />
          </Pressable>

          <View />

          <Pressable
            onPress={goNext}
            disabled={!canGoForward}
            hitSlop={12}
            style={({ pressed }) => ({
              padding: 8,
              opacity: !canGoForward ? 0.25 : pressed ? 0.5 : 1,
            })}
          >
            <ChevronRight size={22} color="#3F2E1E" />
          </Pressable>
        </View>

        {/* Loading / error / list */}
        {eventsQuery.isLoading && (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        )}

        {eventsQuery.isError && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text className="font-body text-[13px] text-accent-sienna text-center">
              기록을 불러오지 못했어요.
            </Text>
          </View>
        )}

        {!eventsQuery.isLoading && !eventsQuery.isError && (
          <RecordTimelineList
            events={events}
            date={selectedDate}
            now={now}
            onItemPress={handleItemPress}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
