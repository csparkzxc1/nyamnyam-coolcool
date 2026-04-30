import { useState } from 'react';

import type { LayoutChangeEvent } from 'react-native';
import { Pressable, Text, View } from 'react-native';

import { DailySummaryRow } from '@/components/record/DailySummaryRow';
import type { DailySummary } from '@/features/logging/summarizeEvents';
import {
  dayFraction,
  filterEventsForDay,
  MARKER_HOURS,
  type TimelineEvent,
  type TimelineEventKind,
} from '@/lib/timelineEvents';

export interface TimelineProps {
  events: readonly TimelineEvent[];
  /** Reference "now" for the current-time marker. Defaults to live Date. */
  now?: Date;
  /** Reference day. Events outside this day are filtered out. Defaults to now. */
  referenceDay?: Date;
  onEventPress?: (event: TimelineEvent) => void;
  /** Optional daily totals row rendered just under the TODAY header. */
  summary?: DailySummary;
}

interface RowConfig {
  kind: TimelineEventKind;
  label: string;
  dotColor: string;
  rangeColor: string;
}

const ROWS: readonly RowConfig[] = [
  {
    kind: 'feed',
    label: '수유',
    dotColor: '#0984E3',
    rangeColor: 'rgba(116, 185, 255, 0.45)',
  },
  {
    kind: 'sleep',
    label: '수면',
    dotColor: '#6C5CE7',
    rangeColor: 'rgba(162, 155, 254, 0.45)',
  },
  {
    kind: 'diaper',
    label: '기저귀',
    dotColor: '#E0A53A',
    rangeColor: 'rgba(253, 203, 110, 0.45)',
  },
  {
    kind: 'bath',
    label: '목욕',
    dotColor: '#00B5B0',
    rangeColor: 'rgba(129, 236, 236, 0.45)',
  },
];

const ROW_HEIGHT = 22;
const DOT_SIZE = 9;
const LABEL_WIDTH = 36;

export function Timeline({
  events,
  now = new Date(),
  referenceDay,
  onEventPress,
  summary,
}: TimelineProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  const day = referenceDay ?? now;
  const todaysEvents = filterEventsForDay(events, day);
  const nowFraction = dayFraction(now, day);

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View>
      {/* Header */}
      <View className="mb-[10px] flex-row items-center justify-between">
        <Text className="font-display text-[13px] tracking-wider" style={{ color: '#5C4A37' }}>
          TODAY · 24h
        </Text>
        <Text className="font-mono text-[10px]" style={{ color: '#8A7A63' }}>
          {`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
            2,
            '0',
          )}`}
        </Text>
      </View>

      {/* Daily summary (optional) — sits between the header and the graph */}
      {summary && (
        <View style={{ marginBottom: 10 }}>
          <DailySummaryRow summary={summary} />
        </View>
      )}

      {/* Rows + track */}
      <View className="flex-row">
        {/* Left labels */}
        <View
          style={{
            width: LABEL_WIDTH,
            justifyContent: 'space-around',
            paddingVertical: 2,
          }}
        >
          {ROWS.map((row) => (
            <Text
              key={row.kind}
              className="text-[10px]"
              style={{ color: '#8A7A63', height: ROW_HEIGHT, lineHeight: ROW_HEIGHT }}
            >
              {row.label}
            </Text>
          ))}
        </View>

        {/* Track */}
        <View
          onLayout={handleLayout}
          style={{
            flex: 1,
            backgroundColor: '#F4EBDC',
            borderRadius: 12,
            paddingVertical: 6,
            paddingHorizontal: 6,
            position: 'relative',
          }}
        >
          {ROWS.map((row) => (
            <View
              key={row.kind}
              style={{
                height: ROW_HEIGHT,
                position: 'relative',
                justifyContent: 'center',
              }}
            >
              {/* Faint baseline */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(42, 29, 18, 0.06)',
                  top: ROW_HEIGHT / 2,
                }}
              />

              {/* Events on this row */}
              {trackWidth > 0 &&
                todaysEvents
                  .filter((e) => e.kind === row.kind)
                  .map((event) => {
                    const startFrac = dayFraction(event.startedAt, day);
                    const startX = startFrac * trackWidth;

                    // Range event (sleep, feed) — render as a bar
                    if (event.endedAt) {
                      const endFrac = dayFraction(event.endedAt, day);
                      const widthPx = Math.max(DOT_SIZE, (endFrac - startFrac) * trackWidth);
                      return (
                        <Pressable
                          key={event.id}
                          onPress={() => onEventPress?.(event)}
                          hitSlop={10}
                          style={{
                            position: 'absolute',
                            left: startX,
                            width: widthPx,
                            height: 6,
                            top: ROW_HEIGHT / 2 - 3,
                            backgroundColor: row.rangeColor,
                            borderRadius: 3,
                          }}
                        />
                      );
                    }

                    // Single-instant event — render as a dot
                    return (
                      <Pressable
                        key={event.id}
                        onPress={() => onEventPress?.(event)}
                        hitSlop={10}
                        style={{
                          position: 'absolute',
                          left: startX - DOT_SIZE / 2,
                          width: DOT_SIZE,
                          height: DOT_SIZE,
                          top: ROW_HEIGHT / 2 - DOT_SIZE / 2,
                          backgroundColor: row.dotColor,
                          borderRadius: DOT_SIZE / 2,
                        }}
                      />
                    );
                  })}
            </View>
          ))}

          {/* "Now" vertical marker — rendered last so it sits above events */}
          {trackWidth > 0 ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 6 + nowFraction * (trackWidth - 12),
                top: 0,
                bottom: 0,
                width: 1.5,
                backgroundColor: '#B85428',
                opacity: 0.85,
              }}
            />
          ) : null}
        </View>
      </View>

      {/* Hour markers */}
      <View className="flex-row" style={{ paddingLeft: LABEL_WIDTH, marginTop: 6 }}>
        <View style={{ flex: 1, position: 'relative', height: 14 }}>
          {MARKER_HOURS.map((hour) => {
            const frac = hour / 24;
            return (
              <Text
                key={hour}
                className="font-mono text-[9px]"
                style={{
                  position: 'absolute',
                  left: `${frac * 100}%`,
                  transform: [{ translateX: -8 }],
                  color: '#8A7A63',
                }}
              >
                {String(hour).padStart(2, '0')}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}
