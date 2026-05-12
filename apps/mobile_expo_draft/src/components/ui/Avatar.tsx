import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  style?: ViewStyle;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getColorForName(name: string): string {
  const colors = ['#1e3a5f', '#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name = '?', uri, size = 44, style }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorForName(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
