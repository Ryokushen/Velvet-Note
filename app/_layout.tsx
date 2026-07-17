import { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { useReducedMotion } from '../lib/motion';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cached data must outlive the persistence window or hydration is moot.
      gcTime: CACHE_MAX_AGE_MS,
    },
  },
});

const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'velvet-note-query-cache',
});

// Keep the collection-to-detail handoff entirely on the native stack. The
// previous shared-element overlay depended on JS measurements and route-mount
// timing, which made the same transition land differently across frames and
// devices. This animation is composited by react-native-screens and reverses
// naturally for both the header button and the system back gesture.
export const fragranceScreenOptions = {
  headerShown: false,
  animation: 'fade_from_bottom' as const,
  animationDuration: 280,
  presentation: 'card' as const,
  contentStyle: { backgroundColor: colors.background },
  gestureEnabled: true,
};

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !pathname) return;

    const inAuthFlow = pathname === '/sign-in';

    if (!session && !inAuthFlow) {
      router.replace('/sign-in' as never);
    } else if (session && inAuthFlow) {
      router.replace('/' as never);
    }
  }, [session, loading, pathname, segments, router]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
  });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  // Hold the splash until the brand serif is ready; on a font error, render
  // anyway (system serif fallback beats a hang).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: CACHE_MAX_AGE_MS }}
    >
      <AuthProvider>
        <SafeAreaProvider>
          <AuthGate>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.background },
                animation: reduceMotion ? 'none' : 'default',
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="fragrance/[id]"
                options={
                  reduceMotion
                    ? { ...fragranceScreenOptions, animation: 'none' }
                    : fragranceScreenOptions
                }
              />
              <Stack.Screen name="scan" options={{ headerShown: false }} />
              <Stack.Screen name="barcode-review" options={{ headerShown: false }} />
              <Stack.Screen
                name="wrapped"
                options={{
                  headerShown: false,
                  animation: reduceMotion ? 'none' : 'fade',
                  animationDuration: 220,
                }}
              />
            </Stack>
          </AuthGate>
        </SafeAreaProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
