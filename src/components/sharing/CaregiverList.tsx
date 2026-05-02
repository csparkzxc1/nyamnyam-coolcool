import { Alert, Pressable, Text, View } from 'react-native';

import { Trash2, User } from 'lucide-react-native';

import type { Caregiver } from '@/features/sharing/api';

const ROLE_LABEL: Record<string, string> = {
  parent: '부모',
  grandparent: '조부모',
  caregiver: '돌봄',
};

export interface CaregiverListProps {
  caregivers: readonly Caregiver[];
  /** Current user's id — used to disable self-removal. */
  currentUserId: string;
  /** Whether the current user has permission to remove others (parent role). */
  canManage: boolean;
  onRemove: (caregiver: Caregiver) => void;
}

export function CaregiverList({
  caregivers,
  currentUserId,
  canManage,
  onRemove,
}: CaregiverListProps) {
  const handleRemovePress = (caregiver: Caregiver) => {
    Alert.alert(
      '보호자 제거',
      `정말 이 보호자를 제거할까요? 제거 후에는 이 아기 데이터에 접근할 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '제거', style: 'destructive', onPress: () => onRemove(caregiver) },
      ],
    );
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        gap: 12,
      }}
    >
      <Text
        className="font-body text-[11px] uppercase tracking-[2px]"
        style={{ color: '#8A7A63' }}
      >
        함께 돌보는 사람 {caregivers.length}명
      </Text>

      {caregivers.length === 0 ? (
        <Text className="font-body text-[13px]" style={{ color: '#8A7A63' }}>
          아직 등록된 보호자가 없어요.
        </Text>
      ) : (
        caregivers.map((c) => {
          const isSelf = c.user_id === currentUserId;
          const showRemoveBtn = canManage && !isSelf;
          return (
            <View
              key={c.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#FAF4EC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={18} color="#B85428" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  className="font-body text-[14px] font-medium"
                  style={{ color: '#2A1D12' }}
                >
                  {ROLE_LABEL[c.role] ?? c.role}
                  {isSelf ? ' · 나' : ''}
                </Text>
                <Text className="font-body text-[11px]" style={{ color: '#8A7A63' }}>
                  {new Date(c.created_at).toLocaleDateString('ko-KR')} 합류
                </Text>
              </View>
              {showRemoveBtn ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="보호자 제거"
                  onPress={() => handleRemovePress(c)}
                  hitSlop={10}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Trash2 size={16} color="#B85428" />
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}
