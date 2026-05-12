import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { I18nManager } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';

export default function TeacherLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'teacher') {
    return <Redirect href="/(student)/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
