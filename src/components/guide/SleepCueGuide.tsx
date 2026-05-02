import { useState } from 'react';

import { Pressable, Text, View } from 'react-native';

import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { SLEEP_CUE_OVERTIRED_WARNING, SLEEP_CUES } from '@/data/sleepCues';

/**
 * Educational card list of the six sleep cues from PRD §4.4. Each card
 * collapses to its title and emoji; tapping expands the description.
 *
 * Tap-to-expand instead of always-expanded keeps the list scannable —
 * caregivers can rapid-check "did I see any of these?" without wading
 * through paragraphs they already know.
 *
 * Accessibility note: Pressable's default role is button; the chevron
 * icon doubles as the visual affordance and the screen-reader will
 * announce the title.
 */
export function SleepCueGuide() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <View>
        <Text
          className="font-body text-[11px] uppercase tracking-[2px]"
          style={{ color: '#8A7A63' }}
        >
          교육 콘텐츠
        </Text>
        <Text
          className="mt-[4px] font-display text-[16px] font-medium"
          style={{ color: '#2A1D12' }}
        >
          졸림 신호 6가지
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {SLEEP_CUES.map((cue) => {
          const isExpanded = expandedId === cue.id;
          return (
            <Pressable
              key={cue.id}
              accessibilityRole="button"
              accessibilityLabel={`${cue.title} 자세히 보기`}
              onPress={() => setExpandedId(isExpanded ? null : cue.id)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(42, 29, 18, 0.04)' : '#FAF4EC',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>{cue.icon}</Text>
                <Text
                  className="flex-1 font-display text-[15px] font-medium"
                  style={{ color: '#2A1D12' }}
                >
                  {cue.title}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={18} color="#8A7A63" />
                ) : (
                  <ChevronDown size={18} color="#8A7A63" />
                )}
              </View>

              {isExpanded ? (
                <Text
                  className="mt-[10px] font-body text-[13px]"
                  style={{
                    color: '#5C4A37',
                    lineHeight: 13 * 1.6,
                  }}
                >
                  {cue.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          backgroundColor: 'rgba(184, 84, 40, 0.08)',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginTop: 4,
        }}
      >
        <Text
          className="font-body text-[12px]"
          style={{ color: '#B85428', lineHeight: 12 * 1.6 }}
        >
          {SLEEP_CUE_OVERTIRED_WARNING}
        </Text>
      </View>
    </View>
  );
}
