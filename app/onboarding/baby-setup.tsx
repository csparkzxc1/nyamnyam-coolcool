import { Redirect } from 'expo-router';

/**
 * Backward-compat redirect — the single-screen onboarding was replaced
 * by the 5-step wizard at `/onboarding/{1..5}`. Any old client (or
 * deep link from external docs) still pointing at `/onboarding/baby-setup`
 * lands on Step 2 (the screen this file used to host) directly.
 */
export default function BabySetupRedirect() {
  return <Redirect href="/onboarding/2" />;
}
