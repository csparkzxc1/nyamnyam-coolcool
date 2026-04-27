import { View } from 'react-native';

import { QuickLogButton, type QuickLogKind } from './QuickLogButton';

export interface QuickLogGridProps {
  /** Currently active kind, or null if no timer is running. */
  activeKind: QuickLogKind | null;
  /** Counter text for the active button only (e.g. "00:35"). */
  activeTimer?: string;
  /** Per-kind "last at" text. Missing keys render as "처음". */
  lastAt?: Partial<Record<QuickLogKind, string>>;
  /** Per-kind subtitle. */
  subtitles?: Partial<Record<QuickLogKind, string>>;
  onPress: (kind: QuickLogKind) => void;
  onLongPress?: (kind: QuickLogKind) => void;
}

const ORDER: readonly QuickLogKind[] = ['feed', 'sleep', 'diaper', 'bath'];

export function QuickLogGrid({
  activeKind,
  activeTimer,
  lastAt,
  subtitles,
  onPress,
  onLongPress,
}: QuickLogGridProps) {
  return (
    <View style={{ gap: 10 }}>
      {/* Row 1: feed, sleep */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickLogButton
          kind="feed"
          isActive={activeKind === 'feed'}
          lastAtText={lastAt?.feed}
          subtitle={subtitles?.feed}
          activeTimer={activeKind === 'feed' ? activeTimer : undefined}
          onPress={() => onPress('feed')}
          onLongPress={onLongPress ? () => onLongPress('feed') : undefined}
        />
        <QuickLogButton
          kind="sleep"
          isActive={activeKind === 'sleep'}
          lastAtText={lastAt?.sleep}
          subtitle={subtitles?.sleep}
          activeTimer={activeKind === 'sleep' ? activeTimer : undefined}
          onPress={() => onPress('sleep')}
          onLongPress={onLongPress ? () => onLongPress('sleep') : undefined}
        />
      </View>

      {/* Row 2: diaper, bath */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickLogButton
          kind="diaper"
          isActive={activeKind === 'diaper'}
          lastAtText={lastAt?.diaper}
          subtitle={subtitles?.diaper}
          activeTimer={activeKind === 'diaper' ? activeTimer : undefined}
          onPress={() => onPress('diaper')}
          onLongPress={onLongPress ? () => onLongPress('diaper') : undefined}
        />
        <QuickLogButton
          kind="bath"
          isActive={activeKind === 'bath'}
          lastAtText={lastAt?.bath}
          subtitle={subtitles?.bath}
          activeTimer={activeKind === 'bath' ? activeTimer : undefined}
          onPress={() => onPress('bath')}
          onLongPress={onLongPress ? () => onLongPress('bath') : undefined}
        />
      </View>
    </View>
  );
}

// Re-export for callers
export type { QuickLogKind } from './QuickLogButton';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ORDER_FOR_FUTURE = ORDER;
