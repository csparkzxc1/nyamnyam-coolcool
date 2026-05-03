import { useCallback, useState } from 'react';

import { Alert, Share, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BabyInfoStep } from '@/components/onboarding/BabyInfoStep';
import { FamilyShareStep } from '@/components/onboarding/FamilyShareStep';
import { FeedingTypeStep } from '@/components/onboarding/FeedingTypeStep';
import { NotificationStep } from '@/components/onboarding/NotificationStep';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { createBaby, type Baby } from '@/features/babies/api';
import { createFeedingRecord } from '@/features/logging/api';
import { createInvite } from '@/features/sharing/api';
import { buildInviteUrl } from '@/features/sharing/inviteToken';
import { supabase } from '@/lib/supabase';
import { useNotificationSettingsStore } from '@/stores/notificationSettingsStore';
import {
  lastFeedAtFromChoice,
  useOnboardingStore,
} from '@/stores/onboardingStore';
import { useSessionStore } from '@/stores/sessionStore';

const TOTAL_STEPS = 5;

function parseStep(raw: string | string[] | undefined): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== 'string') return null;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n < 1 || n > TOTAL_STEPS) return null;
  return n;
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Onboarding wizard route — `/onboarding/{1..5}`. Each step is a
 * separate screen component; this file owns the cross-step flow:
 *
 *   - Navigation between steps via router.push/back.
 *   - Final commit (Step 5): createBaby → optional synthetic feed →
 *     persist notification preferences → optional invite link.
 *   - Store reset on completion so a 2nd baby starts fresh.
 *
 * Step state lives in `useOnboardingStore` so each step can be
 * navigated back into without losing input.
 */
export default function OnboardingStepScreen() {
  const params = useLocalSearchParams<{ step: string }>();
  const step = parseStep(params.step);

  const queryClient = useQueryClient();
  const setCurrentBabyId = useSessionStore((s) => s.setCurrentBabyId);
  const onboarding = useOnboardingStore();
  const notifSettings = useNotificationSettingsStore();

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const goToStep = useCallback((n: number) => {
    router.replace(`/onboarding/${n}`);
  }, []);

  /**
   * createBaby + back-date a synthetic feed when the user chose one
   * on Step 3 + apply notification preferences. Returns the new baby
   * row so the caller can chain createInvite.
   */
  const finalize = useCallback(async (): Promise<Baby> => {
    if (!onboarding.birthDate || !onboarding.gender) {
      throw new Error('필수 정보가 비어 있어요. 처음부터 다시 시도해 주세요.');
    }
    const weight =
      onboarding.weightKg.trim() === ''
        ? null
        : Number.parseFloat(onboarding.weightKg);
    const baby = await createBaby({
      name: onboarding.name.trim(),
      birthDate: formatIsoDate(onboarding.birthDate),
      gender: onboarding.gender,
      feedingType: onboarding.feedingType,
      weightKg: Number.isFinite(weight) && weight !== null ? weight : null,
    });

    queryClient.setQueryData<Baby[]>(['babies', 'current-user'], (old) => [
      ...(old ?? []),
      baby,
    ]);
    setCurrentBabyId(baby.id);
    await queryClient.invalidateQueries({ queryKey: ['babies', 'current-user'] });

    // Synthetic last-feed record so the home screen has a data point.
    const lastFeedAt = lastFeedAtFromChoice(onboarding.lastFeedChoice, new Date());
    if (lastFeedAt) {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (userId) {
        await createFeedingRecord({
          baby_id: baby.id,
          created_by: userId,
          // breast/mixed parents most often nurse on the left; a single
          // synthetic record's accuracy doesn't matter for prediction.
          type: onboarding.feedingType === 'formula' ? 'formula' : 'breast_left',
          start_at: lastFeedAt.toISOString(),
          end_at: lastFeedAt.toISOString(),
        }).catch(() => {
          /* synthetic record is best-effort; skip on failure */
        });
      }
    }

    // Persist notification preferences from Steps 4. The actual OS
    // permission is requested inside NotificationStep itself.
    notifSettings.setEnabled(onboarding.notificationsEnabled);
    notifSettings.setTone(onboarding.tone);

    return baby;
  }, [onboarding, notifSettings, queryClient, setCurrentBabyId]);

  const completeAndGoHome = useCallback(() => {
    onboarding.reset();
    router.replace('/(tabs)');
  }, [onboarding]);

  const handleSkip = useCallback(async () => {
    setIsFinalizing(true);
    try {
      await finalize();
      completeAndGoHome();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했어요.';
      Alert.alert('실패', msg);
      setIsFinalizing(false);
    }
  }, [finalize, completeAndGoHome]);

  const createBabyAndInvite = useCallback(async (): Promise<string | null> => {
    setIsFinalizing(true);
    try {
      const baby = await finalize();
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;
      if (!userId) throw new Error('세션이 만료됐어요. 다시 로그인 해주세요.');
      const invite = await createInvite({
        babyId: baby.id,
        invitedBy: userId,
        role: 'parent',
      });
      const url = buildInviteUrl(invite.token);
      setInviteUrl(url);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '초대 생성에 실패했어요.';
      Alert.alert('실패', msg);
      setIsFinalizing(false);
      return null;
    } finally {
      setIsFinalizing(false);
    }
  }, [finalize]);

  const handleShareKakao = useCallback(async () => {
    const url = inviteUrl ?? (await createBabyAndInvite());
    if (!url) return;
    try {
      await Share.share({ message: `우리 아기 기록을 함께 해요!\n${url}` });
    } catch {
      Alert.alert('공유 실패', '잠시 후 다시 시도해 주세요.');
    }
    completeAndGoHome();
  }, [inviteUrl, createBabyAndInvite, completeAndGoHome]);

  const handleCopyLink = useCallback(async () => {
    const url = inviteUrl ?? (await createBabyAndInvite());
    if (!url) return;
    try {
      // expo-clipboard is not installed; the OS Share sheet on both
      // iOS and Android exposes a "Copy" action so this stays
      // dependency-free at the cost of one extra sheet.
      await Share.share({ message: url });
    } catch {
      Alert.alert('복사 실패', '잠시 후 다시 시도해 주세요.');
    }
    completeAndGoHome();
  }, [inviteUrl, createBabyAndInvite, completeAndGoHome]);

  if (step === null) {
    return (
      <SafeAreaView className="flex-1 bg-bg-page">
        {/* Out-of-range param — bounce to step 1 */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessible
          accessibilityLabel="잘못된 온보딩 단계"
          onLayout={() => goToStep(1)}
        />
      </SafeAreaView>
    );
  }

  // Step 1 is full-bleed (gradient), so no SafeAreaView padding needed.
  if (step === 1) {
    return (
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <WelcomeStep onNext={() => goToStep(2)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-page" edges={['top']}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </View>

      {step === 2 ? (
        <BabyInfoStep onBack={() => goToStep(1)} onNext={() => goToStep(3)} />
      ) : null}
      {step === 3 ? (
        <FeedingTypeStep onBack={() => goToStep(2)} onNext={() => goToStep(4)} />
      ) : null}
      {step === 4 ? (
        <NotificationStep onBack={() => goToStep(3)} onNext={() => goToStep(5)} />
      ) : null}
      {step === 5 ? (
        <FamilyShareStep
          inviteUrl={inviteUrl}
          isFinalizing={isFinalizing}
          onShareKakao={handleShareKakao}
          onCopyLink={handleCopyLink}
          onSkip={handleSkip}
          onBack={() => goToStep(4)}
        />
      ) : null}
    </SafeAreaView>
  );
}
