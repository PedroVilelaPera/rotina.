import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { tokens } from '@/theme/tokens';

import { styles } from './styles';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantContainerStyles: Record<ButtonVariant, ViewStyle> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
};

const variantLabelStyles: Record<ButtonVariant, TextStyle> = {
  primary: styles.labelPrimary,
  secondary: styles.labelSecondary,
  ghost: styles.labelGhost,
  danger: styles.labelDanger,
};

const variantSpinnerColors: Record<ButtonVariant, string> = {
  primary: tokens.colors.accent.onPrimary,
  secondary: tokens.colors.text.primary,
  ghost: tokens.colors.text.secondary,
  danger: tokens.colors.text.primary,
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.sizeLg : styles.sizeMd,
        variantContainerStyles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={variantSpinnerColors[variant]} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.labelBase, variantLabelStyles[variant], textStyle]}>{label}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
