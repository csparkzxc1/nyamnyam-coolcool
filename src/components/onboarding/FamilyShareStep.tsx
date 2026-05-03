import { ActivityIndicator, Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { Copy, Send, Users } from 'lucide-react-native';

export interface FamilyShareStepProps {
  /** Generated invite URL when "share" or "copy" is tapped, or null. */
  inviteUrl: string | null;
  /** True while the create-baby + create-invite mutation is running. */
  isFinalizing: boolean;
  onShareKakao: () => void;
  onCopyLink: () => void;
  onSkip: () => void;
  onBack: () => void;
}

/**
 * Step 5 — invite a co-parent or finish solo.
 *
 * Three terminal actions per the spec (T205): kakao share / copy
 * link / "later". All three call the same finalize mutation in the
 * parent — the difference is just whether we open Share / clipboard
 * after the baby + invite rows are created.
 */
export function FamilyShareStep({
  inviteUrl,
  isFinalizing,
  onShareKakao,
  onCopyLink,
  onSkip,
  onBack,
}: FamilyShareStepProps) {
  const handleShare = async () => {
    if (!inviteUrl) {
      onShareKakao();
      return;
    }
    try {
      await Share.share({ message: `우리 아기 기록을 함께 해요!\n${inviteUrl}` });
    } catch {
      Alert.alert('공유 실패', '잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 22, paddingBottom: 32, flexGrow: 1 }}
    >
      <View>
        <Text className="font-display text-[24px] font-medium" style={{ color: '#2A1D12' }}>
          함께 기록할 가족이 있나요?
        </Text>
        <Text className="mt-[6px] font-body text-[13px]" style={{ color: '#8A7A63' }}>
          남편·가족이 함께 기록하면 교대 수유가 훨씬 쉬워져요.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 18,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Users size={20} color="#B85428" strokeWidth={2} />
          <Text
            className="font-display text-[15px] font-medium"
            style={{ color: '#2A1D12' }}
          >
            가족 초대 링크
          </Text>
        </View>
        {inviteUrl ? (
          <Text
            className="font-body text-[12px]"
            style={{ color: '#5C4A37' }}
            numberOfLines={1}
          >
            {inviteUrl}
          </Text>
        ) : (
          <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
            아래 버튼을 누르면 7일 동안 유효한 초대 링크가 만들어져요.
          </Text>
        )}
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="카카오톡으로 공유"
          disabled={isFinalizing}
          onPress={inviteUrl ? handleShare : onShareKakao}
          style={({ pressed }) => ({
            backgroundColor: isFinalizing
              ? '#FFE978'
              : pressed
                ? '#F5DC00'
                : '#FEE500',
            borderRadius: 14,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          })}
        >
          <Send size={16} color="#191919" />
          <Text
            className="font-body text-[14px] font-medium"
            style={{ color: '#191919' }}
          >
            카카오톡으로 초대
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="초대 링크 복사"
          disabled={isFinalizing}
          onPress={onCopyLink}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#EFE4D0' : '#FFFFFF',
            borderRadius: 14,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          })}
        >
          <Copy size={16} color="#5C4A37" />
          <Text
            className="font-body text-[14px] font-medium"
            style={{ color: '#2A1D12' }}
          >
            초대 링크 복사
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="나중에 할게요"
          disabled={isFinalizing}
          onPress={onSkip}
          style={({ pressed }) => ({
            paddingVertical: 12,
            alignItems: 'center',
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Text className="font-body text-[13px]" style={{ color: '#8A7A63' }}>
            나중에 할게요
          </Text>
        </Pressable>
      </View>

      {isFinalizing ? (
        <View style={{ alignItems: 'center', gap: 8 }}>
          <ActivityIndicator />
          <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
            준비 중이에요…
          </Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="이전"
        disabled={isFinalizing}
        onPress={onBack}
        style={({ pressed }) => ({
          paddingVertical: 12,
          alignItems: 'center',
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <Text className="font-body text-[13px]" style={{ color: '#8A7A63' }}>
          이전
        </Text>
      </Pressable>
    </ScrollView>
  );
}
