import React from 'react';
import { View, type ViewProps } from 'react-native';

import { type SpacingTokens, tokens } from '@/theme/tokens';

import { styles } from './styles';

export type CardVariant = 'default' | 'elevated';
export type CardPadding = keyof SpacingTokens | 'none';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: CardPadding;
}

export function Card({
  variant = 'default',
  padding = 'lg',
  style,
  children,
  ...rest
}: CardProps) {
  const paddingStyle = padding === 'none' ? undefined : { padding: tokens.spacing[padding] };

  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' ? styles.elevated : styles.default,
        paddingStyle,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}
