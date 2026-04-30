import { Pressable, Text, View } from 'react-native';

import { differenceInMinutes } from 'date-fns';
import { Bath, Baby, Droplets, Moon } from 'lucide-react-native';

import type { DetailedEvent } from '@/features/logging/eventsTransform';

export interface RecordTimelineItemProps {
  event: DetailedEvent;
  /** Used to compute the elapsed minutes for in-progress range events. */
  now: Date;
  onPress?: (event: DetailedEvent) => void;
}

// ============================================================
// Visual config per kind
// ============================================================

interface KindConfig {
  label: string;
  Icon: typeof Baby;
  iconBg: string;
  iconColor: string;
}

const KIND_CONFIG: Record<DetailedEvent['kind'], KindConfig> = {
  feed: {
    label: '수유',
    Icon: Baby,
    iconBg: 'rgba(74, 144, 226, 0.12)',
    iconColor: '#4A90E2',
  },
  sleep: {
    label: '수면',
    Icon: Moon,
    iconBg: 'rgba(139, 111, 216, 0.12)',
    iconColor: '#8B6FD8',
  },
  diaper: {
    label: '기저귀',
    Icon: Droplets,
    iconBg: 'rgba(245, 184, 65, 0.15)',
    iconColor: '#F5B841',
  },
  bath: {
    label: '목욕',
    Icon: Bath,
    iconBg: 'rgba(76, 175, 175, 0.12)',
    iconColor: '#4CAFAF',
  },
};

// ============================================================
// Label formatters
// ============================================================

/**
 * Korean label for a feeding subtype.
 * Falls back to the raw value if the type is somehow outside the known set.
 */
function formatFeedType(type: string): string {
  switch (type) {
    case 'breast_left':
      return '모유 좌';
    case 'breast_right':
      return '모유 우';
    case 'formula':
      return '분유';
    case 'solid':
      return '이유식';
    default:
      return type;
  }
}

function formatSleepType(type: string): string {
  return type === 'night' ? '밤잠' : '낮잠';
}

function formatDiaperType(type: string): string {
  switch (type) {
    case 'wet':
      return '쉬';
    case 'dirty':
      return '응가';
    case 'both':
      return '둘 다';
    default:
      return type;
  }
}

/**
 * Build the "type · extras" subtitle line.
 * E.g. "분유 · 120ml", "낮잠", "쉬", "목욕".
 */
function formatSubtitle(event: DetailedEvent): string {
  if (event.kind === 'feed') {
    const parts: string[] = [formatFeedType(event.type)];
    if (event.amountMl !== undefined) parts.push(`${event.amountMl}ml`);
    return parts.join(' · ');
  }
  if (event.kind === 'sleep') {
    return formatSleepType(event.type);
  }
  if (event.kind === 'diaper') {
    return formatDiaperType(event.type);
  }
  return '';
}

// ============================================================
// Time formatters
// ============================================================

function formatHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Render the elapsed/total duration in Korean — "1시간 25분", "25분",
 * or "방금" for under a minute. Mirrors the home-screen tone.
 */
function formatDuration(minutes: number): string {
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

// ============================================================
// Component
// ============================================================

/**
 * One row in the record-tab timeline.
 *
 * Layout per spec:
 *   - point-in-time (diaper, bath):
 *       "HH:mm   <icon> <kindLabel>·<subtitle>"
 *   - in-progress range (feed/sleep with no endedAt):
 *       "HH:mm ~  (N분째)
 *        <icon> <kindLabel> · <subtitle> · 진행 중"
 *   - completed range:
 *       "HH:mm ~ HH:mm  · N분
 *        <icon> <kindLabel> · <subtitle>"
 *
 * Tap fires onPress — caller opens the edit modal (Phase 3).
 */
export function RecordTimelineItem({ event, now, onPress }: RecordTimelineItemProps) {
  const cfg = KIND_CONFIG[event.kind];
  const subtitle = formatSubtitle(event);

  // Decide which time line + duration text to show.
  const isRange = event.kind === 'feed' || event.kind === 'sleep';
  const endedAt = isRange ? event.endedAt : undefined;
  const isInProgress = isRange && endedAt === undefined;

  let timeLine: string;
  let badgeText: string | null;
  let suffixIsInProgress = false;

  if (!isRange) {
    timeLine = formatHm(event.startedAt);
    badgeText = null;
  } else if (isInProgress) {
    const elapsed = differenceInMinutes(now, event.startedAt);
    timeLine = `${formatHm(event.startedAt)} ~`;
    badgeText = elapsed < 1 ? '방금' : `${formatDuration(elapsed)}째`;
    suffixIsInProgress = true;
  } else {
    // endedAt is non-null here because we're not in-progress and isRange is true.
    const total = differenceInMinutes(endedAt as Date, event.startedAt);
    if (total < 1) {
      // Same minute (or accidental near-zero) — collapse to a point-in-time
      // display so the row doesn't show "16:06 ~ 16:06" weirdness.
      timeLine = formatHm(event.startedAt);
      badgeText = '· 방금';
    } else {
      timeLine = `${formatHm(event.startedAt)} ~ ${formatHm(endedAt as Date)}`;
      badgeText = `· ${formatDuration(total)}`;
    }
  }

  const subtitleSuffix = suffixIsInProgress ? ' · 진행 중' : '';
  const finalSubtitle = subtitle
    ? `${cfg.label} · ${subtitle}${subtitleSuffix}`
    : cfg.label + subtitleSuffix;

  return (
    <Pressable onPress={() => onPress?.(event)}>
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            opacity: pressed ? 0.7 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Icon block */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: cfg.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <cfg.Icon size={20} color={cfg.iconColor} />
          </View>

          {/* Text block */}
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text className="font-display text-[15px] text-fg-primary">{timeLine}</Text>
              {badgeText !== null && (
                <Text className="font-body text-[12px] text-fg-secondary">{badgeText}</Text>
              )}
            </View>
            <Text className="font-body text-[13px] text-fg-secondary">{finalSubtitle}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
