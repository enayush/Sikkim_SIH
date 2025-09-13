import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import AuthErrorHandler from '@/components/AuthErrorHandler';
import '@/lib/i18n';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSystemUI } from '@/hooks/useSystemUI';

export default function RootLayout() {
  useFrameworkReady();
  useSystemUI();

  return (
    <AuthProvider>
      <LocationProvider>
        <AuthErrorHandler>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="monastery/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="booking" options={{ headerShown: false }} />
            <Stack.Screen name="archive-detail/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          {/* Removed global StatusBar to let individual screens handle it */}
        </AuthErrorHandler>
      </LocationProvider>
    </AuthProvider>
  );
}
