import { StyleSheet } from 'react-native';

import { tokens } from '@/theme/tokens';

export const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  default: {
    backgroundColor: tokens.colors.bg.surface,
  },
  elevated: {
    backgroundColor: tokens.colors.bg.elevated,
  },
});
