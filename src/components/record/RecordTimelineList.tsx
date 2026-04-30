import { Text, View } from 'react-native';

import { isSameDay, subDays } from 'date-fns';

import type { DetailedEvent } from '@/features/logging/eventsTransform';
import { summarizeEvents } from '@/features/logging/summarizeEvents';

import { DailySummaryRow } from './DailySummaryRow';
import { RecordTimelineItem } from './RecordTimelineItem';

export interface RecordTimelineListProps {
  /** Events for the selected day. May be empty. */
  events: readonly DetailedEvent[];
  /** The day this list represents (used for the header label). */
  date: Date;
  /** Current time, threaded down to RecordTimelineItem for in-progress duration. */
  now: Date;
  onItemPress?: (event: DetailedEvent) => void;
}

// ============================================================
// Header date formatter
// ============================================================

const WEEKDAY_KO: readonly string[] = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Render the header label for a calendar day:
 *   - today      → "오늘 (4/29 수)"
 *   - yesterday  → "어제 (4/28 화)"
 *   - other day  → "4월 29일 (수)"
 *
 * Comparing against `now` rather than `new Date()` keeps the label stable
 * across re-renders that fire mid-second.
 */
function formatHeaderDate(date: Date, now: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_KO[date.getDay()];

  if (isSameDay(date, now)) {
    return `오늘 (${month}/${day} ${weekday})`;
  }
  if (isSameDay(date, subDays(now, 1))) {
    return `어제 (${month}/${day} ${weekday})`;
  }
  return `${month}월 ${day}일 (${weekday})`;
}

// ============================================================
// Component
// ============================================================

/**
 * Vertical record-tab list. Renders the day header, count, and one
 * RecordTimelineItem per event in descending time order (newest first).
 *
 * Pure presentational — caller (`(tabs)/log.tsx`) is responsible for
 * fetching events via `useEventsByDate` and handling loading/error states.
 *
 * Spacing/typography follow the home screen's tonal palette so the two
 * tabs feel like the same product.
 */
export function RecordTimelineList({ events, date, now, onItemPress }: RecordTimelineListProps) {
  // Sort newest-first without mutating the caller's array.
  const sorted = [...events].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const summary = summarizeEvents(events, now);

  const headerLabel = formatHeaderDate(date, now);
  const count = sorted.length;

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 4, gap: 4 }}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Text className="font-display text-[18px] text-fg-primary">{headerLabel}</Text>
          {count > 0 && <Text className="font-body text-[13px] text-fg-secondary">{count}개</Text>}
        </View>
        {count > 0 && <DailySummaryRow summary={summary} />}
      </View>

      {/* Body */}
      {count === 0 ? (
        <View
          style={{
            paddingVertical: 48,
            alignItems: 'center',
          }}
        >
          <Text className="font-body text-[14px] text-fg-secondary">기록이 없어요</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {sorted.map((event) => (
            <RecordTimelineItem key={event.id} event={event} now={now} onPress={onItemPress} />
          ))}
        </View>
      )}
    </View>
  );
}
