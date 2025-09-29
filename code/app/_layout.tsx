import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import '@/lib/i18n';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSystemUI } from '@/hooks/useSystemUI';

export default function RootLayout() {
  useFrameworkReady();
  useSystemUI();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <Stack screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' }
            }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="monastery/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="booking" options={{ headerShown: false }} />
              <Stack.Screen name="archive-detail/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
