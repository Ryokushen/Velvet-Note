import { useEffect } from 'react';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
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
              <Stack.Screen name="fragrance/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="scan" options={{ headerShown: false }} />
            </Stack>
          </AuthGate>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
