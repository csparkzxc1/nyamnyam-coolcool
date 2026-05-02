import { useState } from 'react';

import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { CaregiverList } from '@/components/sharing/CaregiverList';
import { InviteCard } from '@/components/sharing/InviteCard';
import { useCurrentBaby } from '@/features/babies/hooks';
import {
  useActiveInvites,
  useCaregivers,
  useCreateInvite,
  useRealtimeBabySync,
  useRemoveCaregiver,
  useRevokeInvite,
} from '@/features/sharing/hooks';
import { useSessionStore } from '@/stores/sessionStore';

const ROLE_OPTIONS: readonly { value: 'parent' | 'grandparent' | 'caregiver'; label: string }[] = [
  { value: 'parent', label: '부모' },
  { value: 'grandparent', label: '조부모' },
  { value: 'caregiver', label: '돌봄' },
];

export default function ShareScreen() {
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id ?? '';
  const babyQuery = useCurrentBaby();
  const babyId = babyQuery.data?.id ?? null;
  // Live updates for caregiver/record changes from other devices.
  useRealtimeBabySync(babyId);

  const invitesQuery = useActiveInvites(babyId);
  const caregiversQuery = useCaregivers(babyId);
  const createInvite = useCreateInvite(babyId);
  const revokeInvite = useRevokeInvite(babyId);
  const removeCaregiver = useRemoveCaregiver(babyId);

  const [chosenRole, setChosenRole] = useState<'parent' | 'grandparent' | 'caregiver'>('parent');

  // The MVP rule: anyone with the 'parent' role can manage caregivers.
  const myRole = caregiversQuery.data?.find((c) => c.user_id === userId)?.role;
  const canManage = myRole === 'parent';

  const handleCreateInvite = () => {
    if (!babyId || !userId) return;
    createInvite.mutate(
      { babyId, invitedBy: userId, role: chosenRole },
      {
        onError: (e) => {
          const msg = e instanceof Error ? e.message : '초대 생성에 실패했어요';
          Alert.alert('실패', msg);
        },
      },
    );
  };

  if (babyQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (babyQuery.isError || !babyQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page px-6">
        <Text className="font-body text-sm text-accent-sienna text-center">
          아기 정보를 불러오지 못했어요.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text
            className="font-body text-[11px] uppercase tracking-[2px]"
            style={{ color: '#8A7A63' }}
          >
            가족 공유
          </Text>
          <Text
            className="mt-[2px] font-display text-[20px] font-medium"
            style={{ color: '#2A1D12' }}
          >
            함께 기록해요
          </Text>
          <Text className="mt-[4px] font-body text-[12px]" style={{ color: '#8A7A63' }}>
            남편·가족이 함께 기록하면 교대 수유와 기록 공유가 쉬워져요.
          </Text>
        </View>

        {/* Role chooser + create invite button */}
        {canManage ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              gap: 10,
            }}
          >
            <Text
              className="font-body text-[12px]"
              style={{ color: '#5C4A37' }}
            >
              초대할 역할 선택
            </Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {ROLE_OPTIONS.map((o) => {
                const active = chosenRole === o.value;
                return (
                  <Pressable
                    key={o.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setChosenRole(o.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: 'center',
                      borderRadius: 10,
                      backgroundColor: active
                        ? '#B85428'
                        : pressed
                          ? '#FAF4EC'
                          : '#FAF4EC',
                    })}
                  >
                    <Text
                      className="font-body text-[12px] font-medium"
                      style={{ color: active ? '#FFF8EF' : '#2A1D12' }}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="새 초대 만들기"
              disabled={createInvite.isPending}
              onPress={handleCreateInvite}
              style={({ pressed }) => ({
                marginTop: 6,
                backgroundColor: createInvite.isPending
                  ? '#D6BFA0'
                  : pressed
                    ? '#9E4621'
                    : '#B85428',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              })}
            >
              <Text className="font-body text-[13px] font-medium" style={{ color: '#FFF8EF' }}>
                {createInvite.isPending ? '생성 중…' : '초대 링크 만들기'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Active invites */}
        {invitesQuery.data?.map((invite) => (
          <InviteCard
            key={invite.token}
            invite={invite}
            onRevoke={() => revokeInvite.mutate(invite.token)}
          />
        ))}

        {/* Caregiver list */}
        <CaregiverList
          caregivers={caregiversQuery.data ?? []}
          currentUserId={userId}
          canManage={canManage}
          onRemove={(c) => removeCaregiver.mutate(c.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
