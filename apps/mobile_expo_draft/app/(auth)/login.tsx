import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Button } from '../../src/components/ui/Button';

const isRTL = I18nManager.isRTL;

const t = {
  title: isRTL ? 'مرحباً بك في EduCore' : 'Welcome to EduCore',
  subtitle: isRTL ? 'سجّل دخولك للمتابعة' : 'Sign in to continue',
  email: isRTL ? 'البريد الإلكتروني' : 'Email',
  password: isRTL ? 'كلمة المرور' : 'Password',
  signIn: isRTL ? 'تسجيل الدخول' : 'Sign In',
  invalidCredentials: isRTL ? 'بيانات غير صحيحة' : 'Invalid credentials',
  errorTitle: isRTL ? 'خطأ' : 'Error',
};

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      switch (data.user.role) {
        case 'teacher':
          router.replace('/(teacher)/dashboard');
          break;
        case 'parent':
          router.replace('/(parent)/dashboard');
          break;
        default:
          router.replace('/(student)/dashboard');
      }
    },
    onError: () => {
      Alert.alert(t.errorTitle, t.invalidCredentials);
    },
  });

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t.errorTitle, isRTL ? 'يرجى تعبئة جميع الحقول' : 'Please fill in all fields');
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo area */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>E</Text>
            </View>
            <Text style={styles.appName}>EduCore</Text>
          </View>

          {/* Header */}
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t.title}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t.subtitle}</Text>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>{t.email}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlInput]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@school.edu"
              placeholderTextColor="#9ca3af"
              textAlign={isRTL ? 'right' : 'left'}
            />

            <Text style={[styles.label, isRTL && styles.rtlText]}>{t.password}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              textAlign={isRTL ? 'right' : 'left'}
            />

            <Button
              title={t.signIn}
              onPress={handleSignIn}
              loading={mutation.isPending}
              style={styles.submitBtn}
              size="lg"
            />
          </View>

          <Text style={styles.footer}>
            {isRTL ? '© 2026 EduCore — جميع الحقوق محفوظة' : '© 2026 EduCore — All rights reserved'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1e3a5f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#f5c518',
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a5f',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 36,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlInput: {
    textAlign: 'right',
  },
  submitBtn: {
    marginTop: 24,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
  },
});
