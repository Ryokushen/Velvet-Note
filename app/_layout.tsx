import { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { MorphOverlayHost } from '../components/MorphOverlayHost';
import { colors } from '../theme/colors';

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
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="fragrance/[id]"
                options={{
                  headerShown: false,
                  animation: 'fade',
                  animationDuration: 220,
                  presentation: 'transparentModal',
                  contentStyle: { backgroundColor: 'transparent' },
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen name="scan" options={{ headerShown: false }} />
              <Stack.Screen name="barcode-review" options={{ headerShown: false }} />
              <Stack.Screen
                name="wrapped"
                options={{ headerShown: false, animation: 'fade', animationDuration: 220 }}
              />
            </Stack>
            <MorphOverlayHost />
          </AuthGate>
        </SafeAreaProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
