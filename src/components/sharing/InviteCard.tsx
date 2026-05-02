import { Alert, Pressable, Share, Text, View } from 'react-native';

import { Copy, Send, Trash2 } from 'lucide-react-native';

import type { Invite } from '@/features/sharing/api';
import { buildInviteUrl } from '@/features/sharing/inviteToken';

export interface InviteCardProps {
  invite: Invite;
  onRevoke: () => void;
}

export function InviteCard({ invite, onRevoke }: InviteCardProps) {
  const url = buildInviteUrl(invite.token);
  const expiresIn = Math.max(
    0,
    Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / (24 * 60 * 60_000)),
  );

  const handleShare = async () => {
    try {
      await Share.share({ message: `우리 아기 기록을 함께 해요!\n${url}` });
    } catch {
      Alert.alert('공유 실패', '링크 공유에 실패했어요. 복사하기를 사용해 주세요.');
    }
  };

  const handleCopy = () => {
    // The Clipboard API is provided by expo-clipboard which we haven't
    // added — fall back to Share with copy intent. Native Share sheet
    // includes "Copy" on iOS/Android, so this stays universal.
    void handleShare();
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 10,
      }}
    >
      <View>
        <Text
          className="font-body text-[11px] uppercase tracking-[2px]"
          style={{ color: '#8A7A63' }}
        >
          진행 중인 초대 · {expiresIn}일 후 만료
        </Text>
        <Text
          className="mt-[4px] font-body text-[13px]"
          style={{ color: '#2A1D12' }}
          numberOfLines={1}
        >
          {url}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="초대 링크 공유"
          onPress={handleShare}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? '#9E4621' : '#B85428',
            borderRadius: 10,
            paddingVertical: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          })}
        >
          <Send size={14} color="#FFF8EF" />
          <Text className="font-body text-[13px] font-medium" style={{ color: '#FFF8EF' }}>
            공유
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="초대 링크 복사"
          onPress={handleCopy}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: '#FAF4EC',
            borderRadius: 10,
            paddingVertical: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Copy size={14} color="#2A1D12" />
          <Text className="font-body text-[13px] font-medium" style={{ color: '#2A1D12' }}>
            복사
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="초대 취소"
          onPress={onRevoke}
          hitSlop={10}
          style={({ pressed }) => ({
            backgroundColor: '#FAF4EC',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Trash2 size={14} color="#8A7A63" />
        </Pressable>
      </View>
    </View>
  );
}
