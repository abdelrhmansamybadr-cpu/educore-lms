import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';

export default function ParentLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'parent') {
    if (user?.role === 'teacher') return <Redirect href="/(teacher)/dashboard" />;
    return <Redirect href="/(student)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
