import React from 'react';
import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme[type ?? 'background'] }, style]}
      {...otherProps}
    />
  );
}
