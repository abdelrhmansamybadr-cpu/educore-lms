import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

/**
 * Root index — redirect based on auth state and user role.
 */
export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (user?.role) {
    case 'teacher':
      return <Redirect href="/(teacher)/dashboard" />;
    case 'parent':
      return <Redirect href="/(parent)/dashboard" />;
    default:
      return <Redirect href="/(student)/dashboard" />;
  }
}
