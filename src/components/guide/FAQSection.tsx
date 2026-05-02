import { useState } from 'react';

import { Pressable, Text, View } from 'react-native';

import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { FAQS } from '@/data/faqs';

/**
 * Accordion of 10 newborn-parent FAQs (data in src/data/faqs.ts). Only
 * one entry is open at a time — keeps the page scannable on small
 * screens and matches the reading rhythm of "scroll → tap → read → close".
 *
 * Body text uses the 1.6 line height required by IMPLEMENTATION_PLAN T703.
 */
export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

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
          자주 묻는 질문
        </Text>
        <Text
          className="mt-[4px] font-display text-[16px] font-medium"
          style={{ color: '#2A1D12' }}
        >
          초보엄마 FAQ
        </Text>
      </View>

      <View>
        {FAQS.map((faq, idx) => {
          const isOpen = openId === faq.id;
          const isLast = idx === FAQS.length - 1;
          return (
            <Pressable
              key={faq.id}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={faq.question}
              onPress={() => setOpenId(isOpen ? null : faq.id)}
              style={({ pressed }) => ({
                paddingVertical: 14,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: 'rgba(42, 29, 18, 0.06)',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <Text
                  className="flex-1 font-body text-[14px] font-medium"
                  style={{ color: '#2A1D12', lineHeight: 14 * 1.5 }}
                >
                  {faq.question}
                </Text>
                {isOpen ? (
                  <ChevronUp size={18} color="#8A7A63" style={{ marginTop: 2 }} />
                ) : (
                  <ChevronDown size={18} color="#8A7A63" style={{ marginTop: 2 }} />
                )}
              </View>

              {isOpen ? (
                <Text
                  className="mt-[10px] font-body text-[13px]"
                  style={{
                    color: '#5C4A37',
                    lineHeight: 13 * 1.6,
                  }}
                >
                  {faq.answer}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
