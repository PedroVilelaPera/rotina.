import { tokens } from '../theme/tokens';

export const Colors = {
  text: tokens.colors.text.primary,
  background: tokens.colors.bg.root,
  backgroundElement: tokens.colors.bg.surface,
  backgroundSelected: tokens.colors.bg.elevated,
  border: tokens.colors.border.subtle,
  accent: tokens.colors.accent.primary,
  onAccent: tokens.colors.accent.onPrimary,
  textSecondary: tokens.colors.text.secondary,
  danger: tokens.colors.semantic.danger,
} as const;

export type ThemeColor = keyof typeof Colors;
