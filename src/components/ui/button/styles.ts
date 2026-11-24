import { StyleSheet } from 'react-native';

import { tokens } from '@/theme/tokens';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sizeMd: {
    minHeight: 44,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm + 2,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md + 2,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.bg.elevated,
    borderColor: tokens.colors.border.subtle,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: tokens.colors.bg.surface,
    borderColor: tokens.colors.semantic.danger,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  labelBase: {
    fontFamily: tokens.fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  labelPrimary: {
    color: tokens.colors.accent.onPrimary,
  },
  labelSecondary: {
    color: tokens.colors.text.primary,
  },
  labelGhost: {
    color: tokens.colors.text.secondary,
  },
  labelDanger: {
    color: tokens.colors.text.primary,
  },
});
