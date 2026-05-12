import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

const COLORS = {
  primary: '#1e3a5f',
  accent: '#f5c518',
  white: '#ffffff',
  disabled: '#9ca3af',
};

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    isDisabled && styles.disabled,
    style ?? {},
  ];

  const labelStyle: TextStyle[] = [
    styles.label,
    styles[`label_${variant}` as keyof typeof styles] as TextStyle,
    styles[`labelSize_${size}` as keyof typeof styles] as TextStyle,
    textStyle ?? {},
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.white : COLORS.primary}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  size_sm: { paddingVertical: 8, paddingHorizontal: 16 },
  size_md: { paddingVertical: 13, paddingHorizontal: 24 },
  size_lg: { paddingVertical: 17, paddingHorizontal: 32 },
  // Variants
  variant_primary: { backgroundColor: COLORS.primary },
  variant_accent: { backgroundColor: COLORS.accent },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  variant_ghost: { backgroundColor: 'transparent' },
  // Labels
  label: { fontWeight: '600' },
  label_primary: { color: COLORS.white },
  label_accent: { color: COLORS.primary },
  label_outline: { color: COLORS.primary },
  label_ghost: { color: COLORS.primary },
  labelSize_sm: { fontSize: 13 },
  labelSize_md: { fontSize: 15 },
  labelSize_lg: { fontSize: 17 },
});
