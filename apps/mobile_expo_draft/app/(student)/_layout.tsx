import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { I18nManager, Platform } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';

const isRTL = I18nManager.isRTL;

const COLORS = {
  primary: '#1e3a5f',
  accent: '#f5c518',
  inactive: '#9ca3af',
  tabBg: '#ffffff',
};

const labels = {
  dashboard: isRTL ? 'الرئيسية' : 'Home',
  courses: isRTL ? 'المقررات' : 'Courses',
  assignments: isRTL ? 'الواجبات' : 'Tasks',
  grades: isRTL ? 'الدرجات' : 'Grades',
  aiTutor: isRTL ? 'المساعد' : 'AI Tutor',
};

export default function StudentLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Teachers and parents should not access student routes
  if (user?.role === 'teacher') {
    return <Redirect href="/(teacher)/dashboard" />;
  }

  if (user?.role === 'parent') {
    return <Redirect href="/(parent)/dashboard" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.tabBg,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: labels.dashboard,
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🏠" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: labels.courses,
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="📚" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: labels.assignments,
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="📝" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: labels.grades,
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🏆" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-tutor"
        options={{
          title: labels.aiTutor,
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🤖" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color, size }: { emoji: string; color: string; size: number }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: size * 0.85, color }}>{emoji}</Text>
  );
}
