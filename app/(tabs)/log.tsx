import { useEffect, useState } from 'react';

import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, isSameDay, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditEventModal } from '@/components/record/EditEventModal';
import { RecordTimelineList } from '@/components/record/RecordTimelineList';
import { useCurrentBaby } from '@/features/babies/hooks';
import {
  deleteBathRecord,
  deleteDiaperRecord,
  deleteFeedingRecord,
  deleteSleepRecord,
  updateBathRecord,
  updateDiaperRecord,
  updateFeedingRecord,
  updateSleepRecord,
} from '@/features/logging/api';
import type { DetailedEvent } from '@/features/logging/eventsTransform';
import { useEventsByDate } from '@/features/logging/hooks';

// ============================================================
// Helpers — dispatch update/delete by event kind
// ============================================================

/**
 * Strips the `kind:` and `id:` prefix off a DetailedEvent.id to recover the
 * raw DB UUID. The transform in eventsTransform.ts adds the prefix to keep
 * UI keys unique across kinds; the DB row id is what update/delete need.
 */
function rawId(event: DetailedEvent): string {
  return event.id.replace(/^(feed|sleep|diaper|bath)-/, '');
}

interface TimePatch {
  startedAt: Date;
  endedAt?: Date;
}

/**
 * Run the appropriate update mutation for the event's kind. Maps app-level
 * camelCase fields to the DB's snake_case columns (start_at / end_at / at).
 */
async function updateByKind(event: DetailedEvent, patch: TimePatch) {
  const id = rawId(event);
  if (event.kind === 'feed') {
    return updateFeedingRecord(id, {
      start_at: patch.startedAt.toISOString(),
      end_at: patch.endedAt ? patch.endedAt.toISOString() : null,
    });
  }
  if (event.kind === 'sleep') {
    return updateSleepRecord(id, {
      start_at: patch.startedAt.toISOString(),
      end_at: patch.endedAt ? patch.endedAt.toISOString() : null,
    });
  }
  if (event.kind === 'diaper') {
    return updateDiaperRecord(id, { at: patch.startedAt.toISOString() });
  }
  // bath
  return updateBathRecord(id, { at: patch.startedAt.toISOString() });
}

async function deleteByKind(event: DetailedEvent) {
  const id = rawId(event);
  if (event.kind === 'feed') return deleteFeedingRecord(id);
  if (event.kind === 'sleep') return deleteSleepRecord(id);
  if (event.kind === 'diaper') return deleteDiaperRecord(id);
  return deleteBathRecord(id);
}

// ============================================================
// Screen
// ============================================================

export default function LogScreen() {
  // ----- now ticker -----
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ----- selected day (defaults to today) -----
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

  // ----- edit modal -----
  const [editing, setEditing] = useState<DetailedEvent | null>(null);

  const queryClient = useQueryClient();
  const babyId = babyQuery.data?.id ?? null;

  const invalidateEvents = () => {
    if (!babyId) return;
    queryClient.invalidateQueries({ queryKey: ['eventsByDate', babyId] });
    // The home screen's `events` query is also keyed off this baby — bust it
    // so the gradient timeline refreshes after an edit.
    queryClient.invalidateQueries({ queryKey: ['events', babyId] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ event, patch }: { event: DetailedEvent; patch: TimePatch }) =>
      updateByKind(event, patch),
    onSuccess: () => {
      invalidateEvents();
      setEditing(null);
    },
    onError: () => {
      // Keep the modal open so the user can retry without re-entering values.
      // A toast/alert here would be nicer but RN's built-in Alert is enough.
      // (Alert is imported transitively via EditEventModal)
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (event: DetailedEvent) => deleteByKind(event),
    onSuccess: () => {
      invalidateEvents();
      setEditing(null);
    },
  });

  const isSubmitting = updateMutation.isPending || deleteMutation.isPending;

  const handleSave = (patch: TimePatch) => {
    if (!editing) return;
    updateMutation.mutate({ event: editing, patch });
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteMutation.mutate(editing);
  };

  // ----- early returns -----
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

  // ----- render -----
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
            onItemPress={setEditing}
          />
        )}
      </ScrollView>

      <EditEventModal
        event={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}
