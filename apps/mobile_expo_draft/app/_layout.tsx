import React, { useEffect } from 'react';
import { View, I18nManager, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/stores/authStore';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Enable RTL if device locale is Arabic
    const isRTL = I18nManager.isRTL;
    if (!isRTL) {
      // Check if system language is Arabic
      const locale =
        Platform.OS === 'ios'
          ? (Intl.DateTimeFormat().resolvedOptions().locale ?? '')
          : (Intl.DateTimeFormat().resolvedOptions().locale ?? '');
      if (locale.startsWith('ar')) {
        I18nManager.forceRTL(true);
      }
    }

    // Hide splash after a brief moment to allow stores to hydrate
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(student)" />
            <Stack.Screen name="(teacher)" />
            <Stack.Screen name="(parent)" />
            <Stack.Screen name="index" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}
