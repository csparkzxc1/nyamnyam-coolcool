import '../global.css';

import { useEffect } from 'react';

import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { createExpoScheduler } from '@/features/notifications/expoScheduler';
import { installScheduler } from '@/features/notifications/runtime';
import { setupNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/sessionStore';

SplashScreen.preventAutoHideAsync();

function Providers({ children }: { children: React.ReactNode }) {
  useReactQueryDevTools(queryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default function RootLayout() {
  const setSession = useSessionStore((s) => s.setSession);

  const [loaded, error] = useFonts({
    Fraunces: require('../assets/fonts/Fraunces-Variable.ttf'),
    'Pretendard Variable': require('../assets/fonts/Pretendard-Variable.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    // Install the production scheduler + Android channels once.
    installScheduler(createExpoScheduler());
    void setupNotifications().catch(() => {
      /* native module unavailable in dev — fine */
    });
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }} />
    </Providers>
  );
}
