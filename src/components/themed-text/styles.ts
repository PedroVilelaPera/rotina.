import { StyleSheet } from 'react-native';

import { tokens } from '@/theme/tokens';

export const styles = StyleSheet.create({
  small: {
    fontFamily: tokens.fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: tokens.fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: tokens.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: tokens.fonts.semiBold,
    fontSize: 48,
    lineHeight: 52,
  },
  subtitle: {
    fontFamily: tokens.fonts.semiBold,
    fontSize: 32,
    lineHeight: 44,
  },
  link: {
    fontFamily: tokens.fonts.medium,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: tokens.fonts.medium,
    lineHeight: 30,
    fontSize: 14,
    color: tokens.colors.accent.primary,
  },
  code: {
    fontFamily: 'monospace',
    fontWeight: '500',
    fontSize: 12,
  },
});
