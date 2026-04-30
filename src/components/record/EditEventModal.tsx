import { useEffect, useState } from 'react';

import { ActivityIndicator, Alert, Modal, Platform, Pressable, Text, View } from 'react-native';

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import type { DetailedEvent } from '@/features/logging/eventsTransform';

export interface EditEventModalProps {
  /** The event being edited. Null = modal closed. */
  event: DetailedEvent | null;
  /** Fires when the user cancels or taps outside. Caller should clear the event prop. */
  onClose: () => void;
  /**
   * Fires when the user taps Save. The caller is responsible for the
   * actual mutation (Supabase) and for closing the modal on success.
   * Receives the new start/end. End is undefined for point-in-time kinds.
   */
  onSave: (next: { startedAt: Date; endedAt?: Date }) => void;
  /** Fires when the user confirms delete. */
  onDelete: () => void;
  /** Disables Save/Delete while a parent mutation is in flight. */
  isSubmitting?: boolean;
}

// ============================================================
// Helpers
// ============================================================

const KIND_LABEL: Record<DetailedEvent['kind'], string> = {
  feed: '🍼 수유',
  sleep: '😴 수면',
  diaper: '💧 기저귀',
  bath: '🛁 목욕',
};

function isRangeKind(kind: DetailedEvent['kind']): boolean {
  return kind === 'feed' || kind === 'sleep';
}

function formatHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ============================================================
// Component
// ============================================================

/**
 * Time-edit + delete modal for a single record.
 *
 * Scope (T701 Phase 3 MVP):
 *  - Edit start time (all kinds)
 *  - Edit end time (feed/sleep only; in-progress events keep `undefined`
 *    until the user explicitly picks an end)
 *  - Delete with confirm Alert
 *  - Date is intentionally fixed — the user is editing within the day
 *    they're already viewing. Cross-day moves require delete-and-recreate.
 *
 * Out of scope (deferred to T702):
 *  - Type changes (모유 좌/우/분유, 쉬/응가/둘 다, 낮잠/밤잠)
 *  - amount_ml, note, quality, color
 *
 * Validation:
 *  - The end-time picker's `minimumDate` is bound to the current start,
 *    so the user can't accidentally pick a backward range.
 */
export function EditEventModal({
  event,
  onClose,
  onSave,
  onDelete,
  isSubmitting = false,
}: EditEventModalProps) {
  // Local draft state — initialised from `event` whenever it changes.
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [endedAt, setEndedAt] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (event) {
      setStartedAt(event.startedAt);
      setEndedAt(isRangeKind(event.kind) && 'endedAt' in event ? event.endedAt : undefined);
    } else {
      setStartedAt(null);
      setEndedAt(undefined);
    }
  }, [event]);

  if (!event || !startedAt) {
    return null;
  }

  const isRange = isRangeKind(event.kind);
  const isInProgress = isRange && endedAt === undefined;

  // ----- handlers -----
  const handleStartChange = (_e: DateTimePickerEvent, picked?: Date) => {
    if (!picked) return;
    setStartedAt(picked);
    // If end is now before start, push it forward to keep the range valid.
    if (endedAt && endedAt < picked) {
      setEndedAt(picked);
    }
  };

  const handleEndChange = (_e: DateTimePickerEvent, picked?: Date) => {
    if (!picked) return;
    setEndedAt(picked);
  };

  const handleSave = () => {
    onSave({ startedAt, endedAt });
  };

  const handleDelete = () => {
    Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onDelete },
    ]);
  };

  const handleEndDisable = () => {
    // Tap "비우기" — clears endedAt back to "in progress" state.
    Alert.alert('진행 중으로 변경', '종료 시각을 비울까요?', [
      { text: '취소', style: 'cancel' },
      { text: '비우기', onPress: () => setEndedAt(undefined) },
    ]);
  };

  return (
    <Modal visible={event !== null} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop — tap outside to cancel */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        {/* Card — stop propagation so taps inside don't dismiss */}
        <Pressable
          onPress={(e) => e?.stopPropagation?.()}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            gap: 16,
          }}
        >
          {/* Header */}
          <Text className="font-display text-[18px] text-fg-primary">
            {KIND_LABEL[event.kind]} 기록 수정
          </Text>

          {/* Start time */}
          <View style={{ gap: 6 }}>
            <Text className="font-body text-[13px] text-fg-secondary">시작 시각</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text className="font-display text-[20px] text-fg-primary" style={{ width: 80 }}>
                {formatHm(startedAt)}
              </Text>
              <DateTimePicker
                value={startedAt}
                mode="time"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={handleStartChange}
              />
            </View>
          </View>

          {/* End time (range kinds only) */}
          {isRange && (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text className="font-body text-[13px] text-fg-secondary">종료 시각</Text>
                {!isInProgress && (
                  <Pressable onPress={handleEndDisable} hitSlop={6}>
                    <Text className="font-body text-[12px] text-accent-sienna">진행 중으로</Text>
                  </Pressable>
                )}
              </View>
              {isInProgress ? (
                <Pressable
                  onPress={() => setEndedAt(new Date(startedAt.getTime() + 60 * 1000))}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: '#F4EBDC',
                    borderRadius: 8,
                  }}
                >
                  <Text className="font-body text-[13px] text-fg-secondary">
                    진행 중 · 탭하여 종료 시각 입력
                  </Text>
                </Pressable>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text className="font-display text-[20px] text-fg-primary" style={{ width: 80 }}>
                    {formatHm(endedAt as Date)}
                  </Text>
                  <DateTimePicker
                    value={endedAt as Date}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    minimumDate={startedAt}
                    onChange={handleEndChange}
                  />
                </View>
              )}
            </View>
          )}

          {/* Save button — primary action, full width for visibility */}
          <Pressable
            onPress={handleSave}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: '#3F2E1E',
              alignItems: 'center',
              marginTop: 8,
              opacity: pressed || isSubmitting ? 0.6 : 1,
            })}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-display text-[15px]" style={{ color: '#FFFFFF' }}>
                저장
              </Text>
            )}
          </Pressable>

          {/* Delete button — destructive, less prominent */}
          <Pressable
            onPress={handleDelete}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: 'rgba(184, 84, 40, 0.08)',
              alignItems: 'center',
              opacity: pressed || isSubmitting ? 0.5 : 1,
            })}
          >
            <Text className="font-display text-[14px] text-accent-sienna">삭제</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              paddingVertical: 10,
              alignItems: 'center',
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Text className="font-body text-[13px] text-fg-secondary">취소</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
