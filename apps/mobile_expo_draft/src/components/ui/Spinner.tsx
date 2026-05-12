import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function Spinner({
  size = 'large',
  color = '#1e3a5f',
  message,
  fullScreen = false,
}: SpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});
