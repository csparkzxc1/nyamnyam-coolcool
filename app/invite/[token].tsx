import { useEffect, useState } from 'react';

import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAcceptInvite, useInvite } from '@/features/sharing/hooks';
import { useSessionStore } from '@/stores/sessionStore';

/**
 * Invite acceptance screen — opened by deep link
 * `nyamnyam://invite/<token>` or by the marketing-site fallback URL.
 *
 * Validates the token, then asks the user to confirm. On confirm:
 *   - acceptInvite() sets used_at + inserts a caregivers row
 *   - the new baby appears in the user's babies list and the share
 *     tab shows the caregiver
 *   - we navigate back to /home
 */
export default function InviteAcceptScreen() {
  const { token: rawToken } = useLocalSearchParams<{ token: string }>();
  const token = typeof rawToken === 'string' ? rawToken : null;

  const session = useSessionStore((s) => s.session);
  const { data: invite, isLoading, isError } = useInvite(token);
  const acceptMutation = useAcceptInvite();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const expired =
    invite && invite.expires_at ? new Date(invite.expires_at) <= new Date() : false;
  const alreadyUsed = invite?.used_at !== null && invite?.used_at !== undefined;

  // Bounce unauthenticated users to the login screen with a return path.
  useEffect(() => {
    if (!session) {
      router.replace(`/auth/login?next=/invite/${token ?? ''}`);
    }
  }, [session, token]);

  if (!token) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page px-6">
        <Text className="font-body text-sm text-accent-sienna">잘못된 초대 링크예요.</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (isError || !invite) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-page px-6">
        <Text className="font-body text-sm text-accent-sienna text-center">
          초대장을 찾을 수 없어요. 초대한 분에게 새 링크를 요청해 주세요.
        </Text>
      </SafeAreaView>
    );
  }

  const isInvalid = expired || alreadyUsed;

  const handleAccept = async () => {
    if (!session) return;
    try {
      await acceptMutation.mutateAsync({ token, userId: session.user.id });
      Alert.alert('가족 공유 완료', '이제 함께 기록할 수 있어요!', [
        { text: '확인', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '초대 수락에 실패했어요.';
      setErrorMessage(msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 18 }}>
        <View>
          <Text
            className="font-body text-[12px] uppercase tracking-[2px]"
            style={{ color: '#8A7A63' }}
          >
            가족 초대
          </Text>
          <Text
            className="mt-[6px] font-display text-[24px] font-medium"
            style={{ color: '#2A1D12' }}
          >
            함께 기록을 시작할까요?
          </Text>
        </View>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            gap: 8,
          }}
        >
          <Text className="font-body text-[12px]" style={{ color: '#8A7A63' }}>
            역할
          </Text>
          <Text className="font-display text-[16px] font-medium" style={{ color: '#2A1D12' }}>
            {invite.role === 'parent'
              ? '부모 (parent)'
              : invite.role === 'grandparent'
                ? '조부모 (grandparent)'
                : '돌봄 (caregiver)'}
          </Text>
          <Text className="mt-[8px] font-body text-[11px]" style={{ color: '#8A7A63' }}>
            만료: {new Date(invite.expires_at).toLocaleString('ko-KR')}
          </Text>
        </View>

        {isInvalid ? (
          <Text
            className="font-body text-[13px] text-accent-sienna"
            style={{ textAlign: 'center' }}
          >
            {alreadyUsed
              ? '이미 사용된 초대장이에요.'
              : '만료된 초대장이에요. 새 링크를 받아 주세요.'}
          </Text>
        ) : (
          <>
            {errorMessage ? (
              <Text className="font-body text-[12px] text-accent-sienna">{errorMessage}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={handleAccept}
              disabled={acceptMutation.isPending}
              style={({ pressed }) => ({
                backgroundColor: acceptMutation.isPending
                  ? '#D6BFA0'
                  : pressed
                    ? '#9E4621'
                    : '#B85428',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              })}
            >
              <Text className="font-body text-[14px] font-medium" style={{ color: '#FFF8EF' }}>
                {acceptMutation.isPending ? '연결 중…' : '함께 시작하기'}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)')}
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
    </SafeAreaView>
  );
}
