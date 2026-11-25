import { StyleSheet } from 'react-native';

import { tokens } from '@/theme/tokens';

export const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: tokens.spacing.xs + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: tokens.fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.colors.text.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: tokens.colors.bg.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md + 2,
    gap: tokens.spacing.sm,
  },
  inputContainerFocused: {
    borderColor: tokens.colors.accent.primary,
  },
  inputContainerError: {
    borderColor: tokens.colors.semantic.danger,
  },
  inputContainerDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontFamily: tokens.fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: tokens.colors.text.primary,
    paddingVertical: tokens.spacing.md,
  },
  helperText: {
    fontFamily: tokens.fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: tokens.colors.text.secondary,
  },
  errorText: {
    fontFamily: tokens.fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: tokens.colors.semantic.danger,
  },
});
